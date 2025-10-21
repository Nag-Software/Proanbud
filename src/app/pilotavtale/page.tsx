"use client";

import React, { useRef, useState } from "react";

// Legg til global type for html2pdf
declare global {
  interface Window {
    html2pdf?: any;
  }
}
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/ui/signature-pad";
import { ProgressModal } from "@/components/ui/progress-modal";

export default function PilotavtalePage() {
  const [progress, setProgress] = useState(0);
  const [progressOpen, setProgressOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sigDialog, setSigDialog] = useState<null | "proanbudSign" | "kundeSign">(null);
  const [form, setForm] = useState({
    kundenavn: "",
    proanbudNavn: "Casper Nag",
    proanbudSign: "",
    kundeNavn: "",
    kundeSign: "",
    kundeDato: "",
  });
  const pdfRef = useRef<HTMLDivElement>(null);
  // Dynamisk import for å unngå SSR-feil
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined" && !window.html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js";
      script.onload = () => setHtml2pdfLoaded(true);
      document.body.appendChild(script);
    } else {
      setHtml2pdfLoaded(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSigClick = (field: "proanbudSign" | "kundeSign") => {
    setSigDialog(field);
  };

  const handleSigSave = (dataUrl: string) => {
    if (sigDialog) setForm(f => ({ ...f, [sigDialog]: dataUrl }));
    setSigDialog(null);
  };

    // Ny PDF-funksjon med html2pdf
  const getPdfBase64 = async (): Promise<string | null> => {
    setProgress(5);
    setProgressOpen(true);
    if (!html2pdfLoaded || !window.html2pdf) {
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      return null;
    }
    const element = document.getElementById('pdf-content');
    if (!element) {
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      return null;
    }
    const options = {
      margin: 0.5,
      filename: 'pilotavtale.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, onclone: (clonedDoc: Document) => {
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach((style: HTMLStyleElement) => {
          if (style.textContent) {
            style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)');
          }
        });
      } },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    const timeout = setTimeout(() => {
      setProgress(100);
      setProgressOpen(false);
      alert("PDF generering tok for lang tid. Prøv igjen.");
    }, 30000);
    try {
      setProgress(10);
      const pdf = window.html2pdf(element, options);
      setProgress(40);
            const pdfDataUri = await pdf.output('datauristring');
      setProgress(80);
      clearTimeout(timeout);
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      const base64 = pdfDataUri.split(',')[1];
      return base64;
    } catch (error) {
      clearTimeout(timeout);
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      alert("Feil ved PDF generering: " + error);
      return null;
    }
  };

  const handleSend = async () => {
    setSending(true);
    let pdfBase64 = await getPdfBase64();
    if (!pdfBase64) {
      setSending(false);
      alert("Kunne ikke generere PDF. Prøv igjen.");
      return;
    }
    const res = await fetch("/api/send-avtale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pdfBase64 }),
    });
    setSending(false);
    if (res.ok) setSent(true);
    else alert("Kunne ikke sende e-post. Prøv igjen.");
  };

  const handleDownload = async () => {
    setProgress(5);
    setProgressOpen(true);
    if (!html2pdfLoaded || !window.html2pdf) {
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      return;
    }
    const element = document.getElementById('pdf-content');
    if (!element) {
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      return;
    }
    const options = {
      margin: 0.5,
      filename: 'pilotavtale.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, onclone: (clonedDoc: Document) => {
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach((style: HTMLStyleElement) => {
          if (style.textContent) {
            style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)');
          }
        });
      } },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    const timeout = setTimeout(() => {
      setProgress(100);
      setProgressOpen(false);
      alert("PDF generering tok for lang tid. Prøv igjen.");
    }, 30000);
    try {
      setProgress(10);
      const pdf = window.html2pdf(element, options);
      setProgress(40);
      await pdf.save();
      setProgress(80);
      clearTimeout(timeout);
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
    } catch (error) {
      clearTimeout(timeout);
      setProgress(100);
      setTimeout(() => setProgressOpen(false), 400);
      alert("Feil ved PDF generering: " + error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10">
      <ProgressModal open={progressOpen} progress={progress} text="Genererer PDF..." />
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 px-8 py-8 relative" id="pdf-content" ref={pdfRef}>
        <img src="/assets/template-logo.png" alt="Proanbud logo" className="block mb-6 max-w-[200px]" />
        <h1 className="text-3xl font-bold text-center text-foreground mb-8">Pilotavtale</h1>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Partene</div>
          <ul className="text-base mb-2">
            <li><b>Leverandør:</b> Proanbud AS (org.nr ...)</li>
            <li><b>Kunde:</b> <input name="kundenavn" value={form.kundenavn} onChange={handleChange} className="border-b border-gray-300 bg-transparent outline-none px-1" placeholder="Kundenavn" /></li>
          </ul>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Formål</div>
          <p className="text-base">Gjennomføre pilot av Proanbud AI‑tilbudstjeneste for å evaluere funksjonalitet, brukervennlighet og verdi for kunde.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Varighet</div>
          <p className="text-base">Avtalen gjelder i 3 måneder fra signering. Forlengelse kan avtales skriftlig.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Pris og vilkår</div>
          <p className="text-base">99 kr/måned for å dekke AI- og serverkostnader. Forutsetter aktiv bruk, løpende tilbakemeldinger og deltakelse i anonymisert case study. Fakturering skjer månedlig.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Ansvar og databehandling</div>
          <p className="text-base">Proanbud behandler data i henhold til gjeldende personvernpolicy og GDPR. All data lagres sikkert og brukes kun til formål knyttet til tjenesten. Kunden har rett til innsyn og sletting av egne data.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Immaterielle rettigheter</div>
          <p className="text-base">Proanbud eier all teknologi og programvare utviklet i prosjektet. Kunden eier og har full råderett over egne data og innhold.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Oppsigelse</div>
          <p className="text-base">Avtalen kan sies opp med 14 dagers skriftlig varsel fra begge parter. Ved oppsigelse slettes kundens data etter ønske.</p>
        </div>
        <div className="mb-7 pb-5 border-b border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Markedsføring</div>
          <p className="text-base">Proanbud kan bruke anonymiserte resultater og erfaringer fra piloten i markedsføring og videre produktutvikling, etter avtale med kunde.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 mt-10 border-t border-gray-200 pt-8">
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-gray-500 text-sm">For Proanbud AS</div>
            <input name="proanbudNavn" value={form.proanbudNavn} onChange={handleChange} disabled className="sig-input border-b border-gray-300 bg-transparent outline-none px-1" placeholder="Navn" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-gray-500 text-sm">For kunde</div>
            <input name="kundeNavn" value={form.kundeNavn} onChange={handleChange} className="sig-input border-b border-gray-300 bg-transparent outline-none px-1" placeholder="Navn" />
            <div>
              <input
                name="kundeSign"
                value={typeof form.kundeSign === "string" && form.kundeSign.startsWith("data:") ? "[Signert]" : form.kundeSign}
                onFocus={() => handleSigClick("kundeSign")}
                readOnly
                className="sig-input border-b border-gray-300 bg-transparent outline-none px-1 cursor-pointer bg-gray-50"
                placeholder="Tegn signatur"
                style={{ background: form.kundeSign ? '#e0f2fe' : undefined }}
              />
              {form.kundeSign && typeof form.kundeSign === "string" && form.kundeSign.startsWith("data:") && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={form.kundeSign} alt="Signatur" className="h-10" />
                  <button
                    type="button"
                    className="text-xs text-red-500 underline ml-2"
                    onClick={() => setForm(f => ({ ...f, kundeSign: "" }))}
                  >
                    Fjern signatur
                  </button>
                </div>
              )}
            </div>
            <input name="kundeDato" value={form.kundeDato} onChange={handleChange} type="date" className="sig-input border-b border-gray-300 bg-transparent outline-none px-1" />
          </div>
        </div>
        <div className="flex gap-4 justify-end mt-10">
          <Button onClick={handleSend} className="bg-foreground text-white hover:bg-black/80 cursor-pointer" disabled={sent || sending}>
            {sending ? "Sender..." : sent ? "Avtale sendt" : "Send avtale"}
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!sent}>
            Last ned
          </Button>
        </div>

        <Dialog open={!!sigDialog} onOpenChange={v => !v && setSigDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tegn signatur</DialogTitle>
            </DialogHeader>
            <SignaturePad
              value={sigDialog ? form[sigDialog] : undefined}
              onChange={() => {}}
              width={480}
              height={180}
            />
            <div className="flex justify-end gap-2 mt-2">
              <DialogClose asChild>
                <Button variant="ghost">Avbryt</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (sigDialog) {
                    const canvas = document.querySelector<HTMLCanvasElement>(".flex-col.items-center.gap-2 canvas");
                    if (canvas) handleSigSave(canvas.toDataURL());
                  }
                }}
              >
                Lagre signatur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
