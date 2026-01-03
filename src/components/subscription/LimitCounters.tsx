'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { Progress } from '@/components/ui/progress';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
// Use server-side email route instead of calling Resend from the client


export const LimitCounters = () => {
  const { usage, loading } = useSubscription();
  const [reporting, setReporting] = React.useState(false);
  const [reportingSent, setReportingSent] = React.useState(false);

  if (loading || !usage) {
    return (
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-text text-center">Laster...</div>
      </div>
    );
  }

  async function sendReport() {
    const emailInput = document.getElementById('reporter-email') as HTMLInputElement;
    const email = emailInput ? emailInput.value : '';

    const message = (document.querySelector('textarea') as HTMLTextAreaElement).value;

    if (!message) {
      alert('Vennligst skriv inn en beskrivelse av problemet.');
      return;
    }

    // POST to server endpoint which will use the Resend API key server-side
    try {
      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'post@proanbud.no',
          subject: 'Problemrapport fra bruker',
          message: `<p>En bruker har rapportert et problem:</p><p>${message.replace(/\n/g, '<br>')}</p><p>E-post for oppfølging: ${email ? email : 'Ikke oppgitt'}</p>`
        })
      });

      const text = await resp.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!resp.ok || data?.error) {
        console.error('Failed to send report', {
          status: resp.status,
          statusText: resp.statusText,
          bodyText: text,
          parsedBody: data,
        });
        alert('Det oppstod en feil ved sending av rapporten. Vennligst prøv igjen senere.');
        return;
      }
    } catch (err: any) {
      console.error('Network error sending report', err);
      alert('Det oppstod en nettverksfeil ved sending av rapporten. Vennligst prøv igjen senere.');
      return;
    }

    setReporting(false);
    setReportingSent(true);
  }

  const getProgressPercentage = (used: number, limit: number) => {
    //if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444'; // red-500
    else if (percentage >= 75) return '#f97316'; // orange-500
    return '#e1e1e1ff'; // green-500
  };

  return (
    <div className="w-full mx-auto">
      <div className="w-full flex justify-center">
        <Button variant="outline" onClick={() => setReporting(true)} className="text-xs text-primary border-black/15 shadow-xs h-6 px-2 mb-2">
          Rapporter et problem
        </Button>
      </div>
      <div className="p-4 border-t border-border space-y-3">
        <div className="text-xs font-medium text-muted-text uppercase tracking-wide">
          Abonnoment-grenser
        </div>
        
        {/* Quotes Counter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-text">Tilbud</span>
            <span className="font-medium">
              {usage.quotesUsed} / {usage.quotesLimit === -1 ? '∞' : usage.quotesLimit}
            </span>
          </div>
          {usage.quotesLimit !== -1 && (
            <Progress 
              value={getProgressPercentage(usage.quotesUsed, usage.quotesLimit)} 
              color={getProgressColor(getProgressPercentage(usage.quotesUsed, usage.quotesLimit))}
              className="h-1 bg-primary/20"
            />
          )}
        </div>

        {/* Customers Counter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-text">Kunder</span>
            <span className="font-medium">
              {usage.customersUsed} / {usage.customersLimit === -1 ? '∞' : usage.customersLimit}
            </span>
          </div>
          {usage.customersLimit !== -1 && (
            <Progress 
              value={getProgressPercentage(usage.customersUsed, usage.customersLimit)} 
              color={getProgressColor(getProgressPercentage(usage.customersUsed, usage.customersLimit))}
              className="h-1"
            />
          )}
        </div>

        {/* Storage Counter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-text">Lagring</span>
            <span className="font-medium">
              {Math.round(usage.storageUsed / 1024)}MB / {usage.storageLimit === -1 ? '∞' : Math.round(usage.storageLimit / 1024)}MB
            </span>
          </div>
          {usage.storageLimit !== -1 && (
            <Progress 
              value={getProgressPercentage(usage.storageUsed, usage.storageLimit)} 
              color={getProgressColor(getProgressPercentage(usage.storageUsed, usage.storageLimit))}
              className="h-1"
            />
          )}
        </div>
      </div>
      {reporting && (
        <Alert className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-medium mb-4">Rapporter et problem</h2>
            <Textarea 
              placeholder="Beskriv problemet ditt her..." 
              className="w-full mb-4"
              required
            />
            <p className="text-xs mb-2 ml-1">Hvis du ønsker å bli kontaktet angående problemet, vennligst oppgi din e-postadresse nedenfor.</p>
            <Input
              type="email"
              placeholder="Din e-postadresse"
              className="w-full mb-4"
              id="reporter-email"
            />
            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={() => setReporting(false)} className="mt-2 px-4 py-2 rounded-md outline-black/20 outline">Lukk</Button>
              <Button variant="outline" onClick={sendReport} className="mt-2 px-4 py-2 rounded-md bg-primary text-white">Send</Button>
            </div>
          </div>
        </Alert>
      )}

      {reportingSent && (
        <Alert className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-medium mb-4">Takk for din rapport!</h2>
            <p>Vi har mottatt din rapport og vil se på problemet så snart som mulig.</p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setReportingSent(false)} className="mt-4 px-4 py-2 rounded-md outline-black/20 outline">Lukk</Button>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};
