import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Compose email body
  const html = `
    <h2>Pilotavtale signert</h2>
    <ul>
      <li><b>Kunde:</b> ${data.kundenavn}</li>
      <li><b>Proanbud Navn:</b> ${data.proanbudNavn}</li>
      <li><b>Proanbud Signatur:</b> ${data.proanbudSign}</li>
      <li><b>Proanbud Dato:</b> ${data.proanbudDato}</li>
      <li><b>Kunde Navn:</b> ${data.kundeNavn}</li>
      <li><b>Kunde Signatur:</b> ${data.kundeSign}</li>
      <li><b>Kunde Dato:</b> ${data.kundeDato}</li>
    </ul>
  `;

  // Use RESEND API (https://resend.com/docs/send-with-node)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  // Legg til PDF som vedlegg hvis sendt fra klienten
  const attachments = data.pdfBase64
    ? [
        {
          filename: "pilotavtale.pdf",
          content: data.pdfBase64,
          type: "application/pdf",
          disposition: "attachment",
        },
      ]
    : undefined;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "PILOTAVTALE-SIGNERT@proanbud.no",
      to: ["post@proanbud.no"],
      subject: "PILOTAVTALE SIGNERT",
      html,
      attachments,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
