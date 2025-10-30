'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, MessageSquare, Building2, Mail, Phone, Calendar, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TilbudsvisningPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const quoteId = params.id as string;
  const token = searchParams.get('token');
  
  const [quote, setQuote] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError('Ingen tilgangstoken funnet. Vennligst bruk lenken fra e-posten.');
      setLoading(false);
      return;
    }

    fetchQuote();
  }, [quoteId, token]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke hente tilbud');
      }

      const data = await response.json();
      setQuote(data.quote);
      setBusinessSettings(data.businessSettings);
    } catch (err: any) {
      setError(err.message || 'En feil oppstod ved lasting av tilbudet');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type: 'approval' | 'rejection' | 'question') => {
    if (!feedbackMessage.trim() && type === 'question') {
      toast({
        title: 'Melding mangler',
        description: 'Vennligst skriv en melding før du sender.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const message = type === 'approval'
        ? `Jeg godkjenner tilbudet. ${feedbackMessage.trim() ? '\n\nKommentar: ' + feedbackMessage : ''}`
        : type === 'rejection'
        ? `Jeg avviser tilbudet. ${feedbackMessage.trim() ? '\n\nBegrunnelse: ' + feedbackMessage : ''}`
        : feedbackMessage;

      const response = await fetch(`/api/quotes/${quoteId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          message,
          type,
          customerName: quote.kundenavn,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke sende tilbakemelding');
      }

      setFeedbackSubmitted(true);
      setFeedbackMessage('');
      
      toast({
        title: type === 'approval' 
          ? '✅ Tilbud godkjent!'
          : type === 'rejection'
          ? 'Tilbud avvist'
          : 'Melding sendt',
        description: type === 'approval'
          ? 'Takk for din godkjenning. Håndverker vil kontakte deg snart.'
          : type === 'rejection'
          ? 'Din tilbakemelding er registrert.'
          : 'Din melding er sendt til håndverkeren.',
      });

      // Refresh quote data
      await fetchQuote();
    } catch (err: any) {
      toast({
        title: 'Feil',
        description: err.message || 'Kunne ikke sende tilbakemelding',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-slate-600">Laster tilbud...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Feil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const statusColor = 
    quote.status === 'vunnet' ? 'bg-green-100 text-green-800' :
    quote.status === 'tapt' ? 'bg-red-100 text-red-800' :
    quote.status === 'venter' ? 'bg-yellow-100 text-yellow-800' :
    'bg-slate-100 text-slate-800';

  const statusText = 
    quote.status === 'vunnet' ? 'Godkjent' :
    quote.status === 'tapt' ? 'Avvist' :
    quote.status === 'venter' ? 'Venter på svar' :
    'Utkast';

  const isCompleted = quote.status === 'vunnet' || quote.status === 'tapt';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              {businessSettings?.logoUrl && (
                <img 
                  src={businessSettings.logoUrl} 
                  alt={businessSettings.companyName} 
                  className="h-12 mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-slate-900">
                {businessSettings?.companyName || 'Tilbud'}
              </h1>
              <p className="text-slate-600 mt-1">
                {businessSettings?.organizationNumber && `Org.nr: ${businessSettings.organizationNumber}`}
              </p>
            </div>
            <Badge className={statusColor}>
              {statusText}
            </Badge>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {quote.prosjekt}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span>{quote.kundenavn}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Dato: {new Date(quote.dato).toLocaleDateString('nb-NO')}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Svarfrist: {new Date(quote.svarfrist).toLocaleDateString('nb-NO')}</span>
                </div>
              </div>
            </div>
            
            {businessSettings && (
              <div className="text-sm space-y-2">
                <h3 className="font-semibold text-slate-900 mb-2">Kontaktinformasjon</h3>
                {businessSettings.phone && (
                  <div className="flex items-center text-slate-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{businessSettings.phone}</span>
                  </div>
                )}
                {businessSettings.email && (
                  <div className="flex items-center text-slate-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{businessSettings.email}</span>
                  </div>
                )}
                {businessSettings.address && (
                  <div className="text-slate-600">
                    {businessSettings.address}, {businessSettings.postalCode} {businessSettings.city}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quote Description */}
        {quote.beskrivelse && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Beskrivelse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">
                {quote.beskrivelse}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Price Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prisgrunnlag</CardTitle>
            <CardDescription>Detaljert oversikt over kostnadene</CardDescription>
          </CardHeader>
          <CardContent>
            {quote.prisgrunnlag && quote.prisgrunnlag.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 font-semibold text-slate-700">
                          Produkt
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-slate-700">
                          Mengde
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-slate-700">
                          Pris
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-slate-700">
                          Beløp
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.prisgrunnlag.map((item: any, index: number) => (
                        <tr 
                          key={index}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium text-slate-900">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-sm text-slate-600">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-slate-700">
                            {item.quantity || 1} {item.unit || 'stk'}
                          </td>
                          <td className="text-right py-3 px-2 text-slate-700">
                            {(item.unitPrice || 0).toLocaleString('nb-NO')} kr
                          </td>
                          <td className="text-right py-3 px-2 font-semibold text-slate-900">
                            {item.amount.toLocaleString('nb-NO')} kr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300">
                        <td colSpan={3} className="py-2 px-2 text-right font-medium text-slate-900">
                          Total:
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-primary">
                          {Number(quote.belop).toLocaleString('nb-NO')} kr
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right font-medium text-slate-900">
                          MVA (25%):
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-primary">
                          {Number(quote.belop * 0.25).toLocaleString('nb-NO')} kr
                        </td>
                      </tr>
                      <tr className="border-t-2 border-slate-100">
                        <td colSpan={3} className="py-4 px-2 text-right font-bold text-slate-900">
                          Total inkl. MVA:
                        </td>
                        <td className="py-4 px-2 text-right font-bold underline text-xl text-primary">
                          {Number(quote.belop * 1.25).toLocaleString('nb-NO')} kr
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {quote.prisgrunnlag.map((item: any, index: number) => (
                    <Card 
                      key={index} 
                      className="px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 truncate pr-2">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right font-semibold text-slate-900 whitespace-nowrap">
                            {item.amount.toLocaleString('nb-NO')} kr
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Mengde: {item.quantity || 1} {item.unit || 'stk'}</span>
                          <span>Pris: {(item.unitPrice || 0).toLocaleString('nb-NO')} kr</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {/* Mobile Totals */}
                  <Card className="p-4 bg-slate-50">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-900">Total:</span>
                        <span className="font-bold text-primary">
                          {Number(quote.belop).toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-900">MVA (25%):</span>
                        <span className="font-bold text-primary">
                          {Number(quote.belop * 0.25).toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">Total inkl. MVA:</span>
                        <span className="font-bold underline text-xl text-primary">
                          {Number(quote.belop * 1.25).toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">
                Ingen prisgrunnlag tilgjengelig
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Section */}
        {!isCompleted && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Svar på tilbudet</CardTitle>
              <CardDescription>
                Godkjenn, avvis eller send spørsmål til håndverkeren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Melding (valgfritt for godkjenning/avvisning)
                </label>
                <Textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Skriv en kommentar eller spørsmål..."
                  rows={4}
                  className="w-full"
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleFeedback('approval')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Godkjenn tilbud
                </Button>

                <Button
                  onClick={() => handleFeedback('rejection')}
                  disabled={submitting}
                  variant="destructive"
                  className="flex-1 text-white"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Avvis tilbud
                </Button>

                <Button
                  onClick={() => handleFeedback('question')}
                  disabled={submitting || !feedbackMessage.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Send spørsmål
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Confirmation */}
        {feedbackSubmitted && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center text-green-800">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-medium">Din tilbakemelding er registrert!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-600 mt-8">
          <p>Powered by Proanbud</p>
        </div>

        {/* Item Details Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-md rounded-xl max-w-xs">
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedItem?.description && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Beskrivelse</h4>
                  <p className="text-slate-600">{selectedItem.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900">Mengde</h4>
                  <p className="text-slate-600">{selectedItem?.quantity || 1} {selectedItem?.unit || 'stk'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Enhetspris</h4>
                  <p className="text-slate-600">{parseFloat((selectedItem?.amount / selectedItem?.quantity || 0).toFixed(2)).toLocaleString('nb-NO')} kr</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900">Total beløp</h4>
                  <p className="font-bold text-lg text-primary">{selectedItem?.amount.toLocaleString('nb-NO')} kr</p>
                </div>
              </div>
              <Button onClick={() => setSelectedItem(null)} className="w-full">
                Lukk
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
