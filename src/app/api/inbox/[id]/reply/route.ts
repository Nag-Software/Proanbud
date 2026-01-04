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
    let customerName: string | null = null;
    if (originalMessage.customerId) {
      const customerRef = db.ref(`users/${userId}/kunder/${originalMessage.customerId}`);
      const customerSnapshot = await customerRef.once('value');
      if (customerSnapshot.exists()) {
        customerEmail = customerSnapshot.val().epost;
        customerName = customerSnapshot.val().navn;
      }
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Kunne ikke finne kunde e-postadresse' },
        { status: 404 }
      );
    }

    // If this message is related to a quote, ensure that quote has a viewToken
    let viewUrl = '';
    const quoteId = originalMessage.quoteId;
    if (quoteId) {
      try {
        const quoteRef = db.ref(`users/${userId}/tilbud/${quoteId}`);
        const quoteSnapshot = await quoteRef.once('value');
        if (quoteSnapshot.exists()) {
          let viewToken = quoteSnapshot.val()?.viewToken;
          if (!viewToken) {
            // Generate a 32 char token (same algorithm used elsewhere)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let token = '';
            for (let i = 0; i < 32; i++) {
              token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            viewToken = token;
            await quoteRef.update({ viewToken });
            console.log('✅ ViewToken generated and saved for quote:', quoteId);
          }

          const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
          viewUrl = `${baseUrl}/tilbudsvisning/${quoteId}?token=${viewToken}`;
        }
      } catch (err) {
        console.warn('⚠️ Could not ensure viewToken for quote:', err);
      }
    }

    // Get business settings for sender info
    const businessRef = db.ref(`users/${userId}/businessSettings`);
    const businessSnapshot = await businessRef.once('value');
    const businessSettings = businessSnapshot.exists() ? businessSnapshot.val() : null;

    const senderDisplayName = 'Proanbud';
    const senderEmail = 'post@proanbud.no';
    const fromHeader = `${senderDisplayName} <${senderEmail}>`;
    const companyName = businessSettings?.companyName || 'Proanbud';

    // Generate email HTML
    const emailHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e5e7;box-shadow:0 4px 12px rgba(0,0,0,0.04);padding:32px;">
        
        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <img src="${businessSettings?.logoUrl || 'https://proanbud.no/logo/light/icon-primary.svg'}" alt="${companyName}" style="max-height:56px;display:block;border-radius:5px;border:none;" />
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <h1 style="margin:0;font-size:22px;font-weight:500;color:#1d1d1f;">Svar fra ${companyName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="font-size:14px;line-height:22px;color:#1d1d1f;">
            <p style="margin:0 0 12px 0;">Du har mottat en melding angående: <strong>${replySubject}</strong></p>
            <div style="padding: 8px 12px; background-color: whitesmoke; border-radius: 8px; margin: 0 0 18px 0;">
                <p style="">
                    ${replyMessage.split('\n\n--- Original melding ---')[0].replace(/\n/g, '<br>')}
                </p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <a href="${viewUrl}" style="background:#1d1d1f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 28px;border-radius:999px;display:inline-block;">Se tilbud</a>
          </td>
        </tr>

        <!-- Info -->
        <tr>
          <td style="font-size:13px;line-height:20px;color:#6e6e73;padding-bottom:24px;">
            <p style="margin:0 0 8px 0;text-align:center;">På tilbudssiden kan du:</p>
            <ul style="margin:8px auto 0 auto;padding:0;list-style:none;max-width:270px;">
              <li style="margin-bottom:2px;">• Se full prissammendrag og beskrivelse</li>
              <li style="margin-bottom:2px;">• Godkjenne eller avvise tilbudet</li>
              <li>• Stille spørsmål eller komme med innspill</li>
            </ul>
          </td>
        </tr>
        
        <!-- Firmainfo -->
        
        <tr>
            <td style="">
                <div style="margin-top:20px; font-size:12px;">
                    <p style="color: #666666; font-size: 13px; margin: 5px 0;">
                      <strong>${companyName}</strong>
                    </p>
                    ${businessSettings?.organizationNumber ? `
                    <p style="color: #999999; font-size: 12px; margin: 5px 0;">
                      Org.nr: ${businessSettings.organizationNumber}
                    </p>
                    ` : ''}
                    ${businessSettings?.phone ? `
                    <p style="color: #666666; font-size: 12px; margin: 5px 0;">
                      📞 ${businessSettings.phone}
                    </p>
                    ` : ''}
                    ${businessSettings?.email ? `
                    <p style="color: #666666; font-size: 12px; margin: 5px 0;">
                      ✉️ ${businessSettings.email}
                    </p>
                    ` : ''}
                  </div>
            </td>
        </tr>
        

        <tr>
          <td>
            <hr style="border:none;border-top:1px solid #e5e5e7;margin:24px 0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="font-size:11px;line-height:18px;color:#86868b;text-align:center;">
            Denne meldingen er ment for <strong>${customerName}</strong> og er sendt fra post@proanbud.no.<br />
            Avsender-IP: 35.219.200.109 · Bergen, Norge.<br />
            Hvis du ikke er riktig mottaker, kan du se bort fra denne e-posten.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
    `;

    // Send email
    console.log('📧 Sending reply email to:', customerEmail);
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromHeader,
      to: [customerEmail],
      subject: replySubject,
      html: emailHtml,
    });

    if (resendError) {
      console.error('❌ Resend rejected reply email:', resendError);
      return NextResponse.json(
        { error: resendError.message || 'E-posttjenesten avviste utsendelsen' },
        { status: 502 }
      );
    }

    const emailId = resendData?.id ?? null;
    console.log('✅ Reply email sent:', emailId);

    // Add reply to message thread/conversation log
    const conversationRef = db.ref(`users/${userId}/inbox/${messageId}/conversation`);
    const replyRef = conversationRef.push();
    
    const replyLog: {
      message: string;
      timestamp: number;
      sentBy: 'business';
      sentTo: string;
      type: 'reply';
      emailId?: string | null;
    } = {
      message: replyMessage.split('\n\n--- Original melding ---')[0], // Only the new reply, not the original
      timestamp: Date.now(),
      sentBy: 'business' as const, // To distinguish from customer messages
      sentTo: customerEmail,
      type: 'reply' as const,
    };

    if (emailId) {
      replyLog.emailId = emailId;
    }

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
    
    const replyInboxMessage: {
      from: string;
      subject: string;
      message: string;
      timestamp: number;
      isRead: boolean;
      type: 'outgoing_reply';
      folder: string;
      sentTo: string;
      relatedMessageId: string;
      opprettet: number;
      oppdatert: number;
      emailId?: string | null;
    } = {
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

    if (emailId) {
      replyInboxMessage.emailId = emailId;
    }

    await newReplyRef.set(replyInboxMessage);

    console.log('✅ Reply inbox message created:', newReplyRef.key);

    console.log('✅ Reply added to conversation log under original message');

    return NextResponse.json({
      success: true,
      emailId: resendData?.id,
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
