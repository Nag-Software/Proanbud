import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      console.error('❌ Resend API key not configured');
      console.error('Please set RESEND_API_KEY in .env.local');
      return NextResponse.json(
        { error: 'Email service not configured - missing RESEND_API_KEY' },
        { status: 503 }
      );
    }

    const { to, subject, message, customerId, quoteId } = await request.json();

    if (!to || !subject || !message) {
      console.error('❌ Missing required fields:', { to: !!to, subject: !!subject, message: !!message });
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    const fromHeader = 'Proanbud <post@proanbud.no>';

    console.log('📧 Sending email:', {
      to,
      subject,
      from: fromHeader,
      quoteId,
      customerId,
      messageLength: message.length
    });

    const { data, error: resendError } = await resend.emails.send({
      from: fromHeader,
      to: [to],
      subject: subject,
      html: message, // Use the message directly as HTML
    });

    if (resendError) {
      console.error('❌ Resend rejected email send:', resendError);
      return NextResponse.json(
        { error: resendError.message || 'Resend kunne ikke sende e-post' },
        { status: 502 }
      );
    }

    console.log('✅ Email sent successfully:', {
      messageId: data?.id,
      to,
      quoteId
    });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      customerId,
      quoteId
    });

  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}