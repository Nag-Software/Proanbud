import { NextRequest, NextResponse } from 'next/server';
import { ref, get, push, set, serverTimestamp, update } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Ingen brukere funnet' },
        { status: 404 }
      );
    }

    let foundUserId: string | null = null;
    let foundQuote: any = null;

    usersSnapshot.forEach((userSnapshot) => {
      const userId = userSnapshot.key;
      const userData = userSnapshot.val();
      
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
      const quoteRef = ref(db, `users/${foundUserId}/tilbud/${id}`);
      await update(quoteRef, {
        status: type === 'approval' ? 'vunnet' : 'tapt',
        oppdatert: serverTimestamp(),
      });
    }

    // Try to find customerId by matching customer name
    let customerId: string | undefined = undefined;
    try {
      const kundersRef = ref(db, `users/${foundUserId}/kunder`);
      const kundersSnapshot = await get(kundersRef);
      
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
    const inboxRef = ref(db, `users/${foundUserId}/inbox`);
    const inboxSnapshot = await get(inboxRef);
    
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
      
      const conversationRef = ref(db, `users/${foundUserId}/inbox/${existingMessageId}/conversation`);
      const newConversationEntryRef = push(conversationRef);
      await set(newConversationEntryRef, conversationEntry);
      
      // Update the main message timestamp and read status
      const messageRef = ref(db, `users/${foundUserId}/inbox/${existingMessageId}`);
      await update(messageRef, {
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
      
      const newMessageRef = push(inboxRef);
      
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

      await set(newMessageRef, inboxMessage);
      console.log('✅ Inbox message created with ID:', newMessageRef.key);
      
      // Add first conversation entry
      const conversationRef = ref(db, `users/${foundUserId}/inbox/${newMessageRef.key}/conversation`);
      const firstConversationEntryRef = push(conversationRef);
      await set(firstConversationEntryRef, conversationEntry);
      
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
