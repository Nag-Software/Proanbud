import { NextRequest, NextResponse } from 'next/server';
import { database as adminDatabase } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    const { id: messageId } = await params;
    const body = await request.json();
    const { userId, replyMessage, replySubject } = body;

    if (!userId || !replyMessage || !replySubject) {
      return NextResponse.json(
        { error: 'userId, replyMessage og replySubject er påkrevd' },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Get the original message
    const messageRef = db.ref(`users/${userId}/inbox/${messageId}`);
    const messageSnapshot = await messageRef.once('value');

    if (!messageSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Melding ikke funnet' },
        { status: 404 }
      );
    }

    const originalMessage = messageSnapshot.val();

    // Get customer email
    let customerEmail: string | null = null;
    if (originalMessage.customerId) {
      const customerRef = db.ref(`users/${userId}/kunder/${originalMessage.customerId}`);
      const customerSnapshot = await customerRef.once('value');
      if (customerSnapshot.exists()) {
        customerEmail = customerSnapshot.val().epost;
      }
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Kunne ikke finne kunde e-postadresse' },
        { status: 404 }
      );
    }

    // Get business settings for sender info
    const businessRef = db.ref(`users/${userId}/businessSettings`);
    const businessSnapshot = await businessRef.once('value');
    const businessSettings = businessSnapshot.exists() ? businessSnapshot.val() : null;

    const fromEmail = businessSettings?.email || 'post@proanbud.no';
    const companyName = businessSettings?.companyName || 'Proanbud';

    // Generate email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          ${businessSettings?.logoUrl ? `<img src="${businessSettings.logoUrl}" alt="${companyName}" style="max-height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Svar fra ${companyName}</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <h2 style="color: #333333; margin-top: 0;">${replySubject}</h2>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6;">
            Hei ${originalMessage.customerName || 'kunde'},
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
              ${replyMessage.split('\n\n--- Original melding ---')[0].replace(/\n/g, '<br>')}
            </p>
          </div>
          
          ${originalMessage.quoteId && originalMessage.quoteTitle ? `
          <div style="margin: 30px 0;">
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              <strong>Angående tilbud:</strong> ${originalMessage.quoteTitle}
            </p>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 40px; padding-top: 20px;">
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              <strong>${companyName}</strong>
            </p>
            ${businessSettings?.organizationNumber ? `
            <p style="color: #999999; font-size: 12px; margin: 5px 0;">
              Org.nr: ${businessSettings.organizationNumber}
            </p>
            ` : ''}
            ${businessSettings?.phone ? `
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              📞 ${businessSettings.phone}
            </p>
            ` : ''}
            ${businessSettings?.email ? `
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              ✉️ ${businessSettings.email}
            </p>
            ` : ''}
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            Powered by Proanbud AI
          </p>
        </div>
      </div>
    `;

    // Send email
    console.log('📧 Sending reply email to:', customerEmail);
    const emailData = await resend.emails.send({
      from: `${companyName} - Proanbud <${fromEmail}>`,
      to: [customerEmail],
      subject: replySubject,
      html: emailHtml,
    });

    console.log('✅ Reply email sent:', emailData.data?.id);

    // Add reply to message thread/conversation log
    const conversationRef = db.ref(`users/${userId}/inbox/${messageId}/conversation`);
    const replyRef = conversationRef.push();
    
    const replyLog = {
      message: replyMessage.split('\n\n--- Original melding ---')[0], // Only the new reply, not the original
      timestamp: Date.now(),
      sentBy: 'business' as const, // To distinguish from customer messages
      sentTo: customerEmail,
      emailId: emailData.data?.id,
      type: 'reply' as const,
    };

    await replyRef.set(replyLog);

    // Update original message as replied
    await messageRef.update({
      hasReply: true,
      lastReplyAt: Date.now(),
      oppdatert: Date.now(),
    });

    // Create a new inbox message for the outgoing reply
    const inboxRef = db.ref(`users/${userId}/inbox`);
    const newReplyRef = inboxRef.push();
    
    const replyInboxMessage = {
      from: companyName,
      subject: replySubject,
      message: replyMessage.split('\n\n--- Original melding ---')[0], // Only the new reply
      timestamp: Date.now(),
      isRead: true, // Outgoing messages are automatically read
      type: 'outgoing_reply',
      folder: 'sendt',
      sentTo: customerEmail,
      relatedMessageId: messageId,
      opprettet: Date.now(),
      oppdatert: Date.now(),
    };

    await newReplyRef.set(replyInboxMessage);

    console.log('✅ Reply inbox message created:', newReplyRef.key);

    console.log('✅ Reply added to conversation log under original message');

    return NextResponse.json({
      success: true,
      emailId: emailData.data?.id,
      replyId: replyRef.key,
      inboxMessageId: newReplyRef.key,
    });

  } catch (error: any) {
    console.error('❌ Error sending reply:', error);
    return NextResponse.json(
      { error: error.message || 'Feil ved sending av svar' },
      { status: 500 }
    );
  }
}
