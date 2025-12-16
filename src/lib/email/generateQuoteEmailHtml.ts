import { BusinessSettings, Kunde, Tilbud } from '@/lib/types';

export interface GenerateQuoteEmailHtmlParams {
  quote: Partial<Tilbud>;
  customer: Kunde;
  businessSettings?: BusinessSettings | null;
  viewUrl?: string | null;
}

/**
 * Builds the HTML used when sending quote emails. Centralizing this template keeps
 * the layout consistent across quote flows.
 */
export function generateQuoteEmailHtml({
  quote,
  customer,
  businessSettings,
  viewUrl,
}: GenerateQuoteEmailHtmlParams): string {
  const companyName = businessSettings?.companyName || 'Håndverksbedrift';
  const companyEmail = businessSettings?.email || '';
  const logoUrl = businessSettings?.logoUrl || 'https://proanbud.no/logo/light/icon-primary.svg';
  const safeViewUrl = viewUrl ?? '#';

  return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e5e7;box-shadow:0 4px 12px rgba(0,0,0,0.04);padding:32px;">
        
        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <img src="${businessSettings?.logoUrl || 'https://proanbud.no/logo/light/icon-primary.svg'}" alt="${companyName}" style="max-height:56px;display:block;border-radius:5px;" />
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <h1 style="margin:0;font-size:22px;font-weight:500;color:#1d1d1f;">Nytt tilbud fra ${companyName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="font-size:14px;line-height:22px;color:#1d1d1f;">
            <p style="margin:0 0 12px 0;">Hei ${customer.navn},</p>
            <p style="margin:0 0 16px 0;">${companyName} (<a href="mailto:${companyEmail}" style="color:#0071e3;text-decoration:none;">${companyEmail}</a>) har sendt deg et nytt tilbud via Proanbud. Tilbudet er gyldig til <strong>${quote.svarfrist}</strong>.</p>
          </td>
        </tr>

        <!-- Price -->
        <tr>
          <td align="center" style="padding:20px 0 28px 0;">
            <div style="font-size:14px;color:#6e6e73;font-weight:600">Totalpris</div>
            <div style="font-size:26px;font-weight:600;color:#1d1d1f;">${quote.belop?.toLocaleString('nb-NO')} kr</div>
            <div style="font-size:13px;color:#6e6e73;">Ekskl. mva</div>
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
              <li style="margin-bottom:6px;">• Se full prissammendrag og beskrivelse</li>
              <li style="margin-bottom:6px;">• Godkjenne eller avvise tilbudet</li>
              <li>• Stille spørsmål eller komme med innspill</li>
            </ul>
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
            Denne meldingen er ment for <strong>${customer.navn}</strong> og er sendt fra post@proanbud.no.<br />
            Avsender-IP: 35.219.200.109 · Bergen, Norge.<br />
            Hvis du ikke er riktig mottaker, kan du se bort fra denne e-posten.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
    `;
}
