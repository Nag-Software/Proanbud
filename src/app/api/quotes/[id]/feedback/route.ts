import { NextRequest, NextResponse } from 'next/server';
import { database as adminDatabase } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let db = adminDatabase;
    if (!db) {
      // Try to initialize database on demand
      if (admin.apps.length > 0) {
        try {
          db = admin.database();
          console.log('✅ Database initialized on demand');
        } catch (error) {
          console.error('❌ Failed to initialize database on demand:', error);
          return NextResponse.json(
            { error: 'Database ikke tilgjengelig' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Database ikke tilgjengelig' },
          { status: 500 }
        );
      }
    }

    const { id } = await params;
    const body = await request.json();
    const { token, message, type, customerName } = body;

    if (!token || !message || !type) {
      return NextResponse.json(
        { error: 'Token, melding og type er påkrevd' },
        { status: 400 }
      );
    }

    // Find the quote and verify token
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');

    if (!usersSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Ingen brukere funnet' },
        { status: 404 }
      );
    }

    let foundUserId: string | null = null;
    let foundQuote: any = null;

    // Search through all users' quotes
    const usersData = usersSnapshot.val();
    Object.entries(usersData || {}).forEach(([userId, userData]: [string, any]) => {
      if (userData.tilbud && userData.tilbud[id]) {
        const quote = userData.tilbud[id];
        if (quote.viewToken === token) {
          foundQuote = quote;
          foundUserId = userId;
        }
      }
    });

    if (!foundUserId || !foundQuote) {
      return NextResponse.json(
        { error: 'Tilbud ikke funnet eller ugyldig token' },
        { status: 404 }
      );
    }

    // Update quote status if approved or rejected
    if (type === 'approval' || type === 'rejection') {
      const quoteRef = db.ref(`users/${foundUserId}/tilbud/${id}`);
      await quoteRef.update({
        status: type === 'approval' ? 'vunnet' : 'tapt',
        oppdatert: Date.now(),
      });
    }

    // Try to find customerId by matching customer name
    let customerId: string | undefined = undefined;
    try {
      const kundersRef = db.ref(`users/${foundUserId}/kunder`);
      const kundersSnapshot = await kundersRef.once('value');
      
      if (kundersSnapshot.exists()) {
        const kundersData = kundersSnapshot.val();
        const customerNameToMatch = (customerName || foundQuote.kundenavn || '').toLowerCase();
        
        Object.entries(kundersData).forEach(([id, kunde]: [string, any]) => {
          if (kunde.navn && kunde.navn.toLowerCase() === customerNameToMatch) {
            customerId = id;
          }
        });
      }
    } catch (error) {
      console.warn('Could not find customerId:', error);
    }
    
    // Check if there's already an inbox message for this quote
    const inboxRef = db.ref(`users/${foundUserId}/inbox`);
    const inboxSnapshot = await inboxRef.once('value');
    
    let existingMessageId: string | null = null;
    let existingMessage: any = null;
    
    if (inboxSnapshot.exists()) {
      const inboxData = inboxSnapshot.val();
      Object.entries(inboxData).forEach(([messageId, message]: [string, any]) => {
        if (message.quoteId === id) {
          existingMessageId = messageId;
          existingMessage = message;
        }
      });
    }

    const conversationEntry = {
      message: message,
      timestamp: Date.now(),
      sentBy: 'customer' as const,
      type: type === 'approval' 
        ? 'quote_approved' 
        : type === 'rejection'
        ? 'quote_rejected'
        : 'quote_question',
    };

    if (existingMessageId && existingMessage) {
      // Add to existing conversation
      console.log('📨 Adding to existing conversation:', existingMessageId);
      
      const conversationRef = db.ref(`users/${foundUserId}/inbox/${existingMessageId}/conversation`);
      const newConversationEntryRef = conversationRef.push();
      await newConversationEntryRef.set(conversationEntry);
      
      // Update the main message timestamp and read status
      const messageRef = db.ref(`users/${foundUserId}/inbox/${existingMessageId}`);
      await messageRef.update({
        oppdatert: Date.now(),
        lastMessageAt: Date.now(),
        isRead: false, // Mark as unread when customer sends new message
      });
      
      console.log('✅ Added to conversation:', newConversationEntryRef.key);

      return NextResponse.json({
        success: true,
        messageId: existingMessageId,
        conversationEntryId: newConversationEntryRef.key,
      });
    } else {
      // Create new inbox message with first conversation entry
      console.log('📨 Creating new inbox message for quote:', id);
      
      const newMessageRef = inboxRef.push();
      
      const inboxMessage = {
        from: customerName || foundQuote.kundenavn || 'Kunde',
        subject: `💬 ${foundQuote.prosjekt}`,
        message: '', // Main message is empty, all content is in conversation
        timestamp: Date.now(),
        isRead: false,
        quoteId: id,
        customerId: customerId,
        type: 'quote_conversation',
        customerName: customerName || foundQuote.kundenavn,
        quoteTitle: foundQuote.prosjekt,
        isFlagged: false,
        folder: 'innboks',
        opprettet: Date.now(),
        oppdatert: Date.now(),
        lastMessageAt: Date.now(),
      };

      await newMessageRef.set(inboxMessage);
      console.log('✅ Inbox message created with ID:', newMessageRef.key);
      
      // Add first conversation entry
      const conversationRef = db.ref(`users/${foundUserId}/inbox/${newMessageRef.key}/conversation`);
      const firstConversationEntryRef = conversationRef.push();
      await firstConversationEntryRef.set(conversationEntry);
      
      console.log('✅ First conversation entry created:', firstConversationEntryRef.key);

      return NextResponse.json({
        success: true,
        messageId: newMessageRef.key,
        conversationEntryId: firstConversationEntryRef.key,
      });
    }

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Feil ved sending av tilbakemelding' },
      { status: 500 }
    );
  }
}
