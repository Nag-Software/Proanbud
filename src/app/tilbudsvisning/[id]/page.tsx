'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, MessageSquare, Building2, Mail, Phone, Calendar, FileText, Loader2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GroupedDataTable from '@/components/shared/GroupedDataTable';
import { Happy_Monkey } from 'next/font/google';

function TilbudsvisningContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const quoteId = params.id as string;
  const token = searchParams.get('token');
  const viewOnly = searchParams.get('viewOnly') === 'true';
  
  const [quote, setQuote] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Check if deadline has expired
  const deadlineExpired = quote ? (quote.svarfrist ? new Date(quote.svarfrist) < new Date() : false) : false;

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
      console.log('📊 Received data:', data);
      console.log('🏢 Business settings:', data.businessSettings);
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

  const handleContactUs = () => {
    setShowContactDialog(true);
  };

  const handleSendContactMessage = async () => {
    if (!contactMessage.trim()) {
      toast({
        title: 'Melding mangler',
        description: 'Vennligst skriv en melding før du sender.',
        variant: 'destructive',
      });
      return;
    }

    setContactSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          message: `(Melding fra kunde etter svarfristen har gått ut)\n\n${contactMessage}`,
          type: 'question',
          customerName: quote.kundenavn,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke sende melding');
      }

      setContactMessage('');
      setShowContactDialog(false);
      
      toast({
        title: 'Melding sendt!',
        description: 'Din melding er sendt til håndverkeren. De vil kontakte deg snart.',
      });

      // Refresh quote data
      await fetchQuote();
    } catch (err: any) {
      toast({
        title: 'Feil',
        description: err.message || 'Kunne ikke sende melding',
        variant: 'destructive',
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4" data-dashboard>
      <div className="max-w-4xl mx-auto">
        {/* Expired Deadline Header */}
        {deadlineExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h3 className="text-red-800 font-semibold">Svarfristen har gått ut</h3>
                  <p className="text-red-700 text-sm">
                    Fristen for å svare på dette tilbudet var {new Date(quote.svarfrist).toLocaleDateString('nb-NO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  onClick={handleContactUs}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Kontakt oss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Company Header - Professional Branding */}
        {businessSettings && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {businessSettings.logoUrl && (
                  <img 
                    src={businessSettings.logoUrl} 
                    alt={businessSettings.companyName} 
                    className="h-16 w-auto object-contain"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {businessSettings.companyName}
                  </h1>
                  {businessSettings.brandDescription && (
                    <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                      {businessSettings.brandDescription}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5 text-sm text-slate-500">
                    {businessSettings.organizationNumber && (
                      <p>Org.nr: {businessSettings.organizationNumber}</p>
                    )}
                    {businessSettings.industry && (
                      <p>{businessSettings.industry}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <Badge className={statusColor}>
                  {statusText}
                </Badge>
              </div>
            </div>
            
            {/* Business Contact Info - Subtle but accessible */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-600">
              {businessSettings.phone && (
                <div className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  <span>{businessSettings.phone}</span>
                </div>
              )}
              {businessSettings.email && (
                <div className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  <span>{businessSettings.email}</span>
                </div>
              )}
              {businessSettings.website && (
                <div className="flex items-center">
                  <span className="mr-1.5">🌐</span>
                  <a 
                    href={businessSettings.website.startsWith('http') ? businessSettings.website : `https://${businessSettings.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {businessSettings.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {businessSettings.serviceAreas && businessSettings.serviceAreas.length > 0 && (
                <div className="flex items-center text-slate-500">
                  <span className="mr-1.5">📍</span>
                  <span>{businessSettings.serviceAreas.slice(0, 3).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Combined Quote and Price Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Tilbud
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 mt-1">
                  {quote.prosjekt}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quote Info Grid */}
            <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Kunde
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-slate-900">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="font-medium">{quote.kundenavn}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Tilbudsinformasjon
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Dato: {new Date(quote.dato).toLocaleDateString('nb-NO')}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Svarfrist: {new Date(quote.svarfrist).toLocaleDateString('nb-NO')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Description */}
            {quote.beskrivelse && (
              <div className="pb-6 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Beskrivelse
                </h3>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {quote.beskrivelse}
                </p>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Prisforslag
                </h3>
              {quote.prisgrunnlag && quote.prisgrunnlag.length > 0 ? (
                <GroupedDataTable items={quote.prisgrunnlag ?? []} editable={false} variant="public" />
              ) : (
                <p className="text-slate-600 text-center py-8">
                  Ingen prisgrunnlag tilgjengelig
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {quote.notater && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notater</CardTitle>
              <CardDescription>Tilleggsinformasjon om prosjektet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap">{quote.notater}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Section */}
        {!viewOnly && !isCompleted && !deadlineExpired && (
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

        {/* Expired Deadline Message */}
        {deadlineExpired && !isCompleted && !viewOnly && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Svarfristen har gått ut
                </h3>
                <p className="text-amber-700 mb-4">
                  Du kan fortsatt kontakte håndverkeren ved å bruke "Kontakt oss" knappen øverst på siden.
                </p>
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

        {/* Professional Footer with Business Info */}
        {businessSettings && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Company Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {businessSettings.companyName}
                  </h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    {businessSettings.address && (
                      <p>
                        {businessSettings.address}<br />
                        {businessSettings.postalCode} {businessSettings.city}
                      </p>
                    )}
                    {businessSettings.organizationNumber && (
                      <p className="text-slate-500">Org.nr: {businessSettings.organizationNumber}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Kontakt</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {businessSettings.phone && (
                      <div className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        <span>{businessSettings.phone}</span>
                      </div>
                    )}
                    {businessSettings.email && (
                      <div className="flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        <span>{businessSettings.email}</span>
                      </div>
                    )}
                    {businessSettings.website && (
                      <div className="flex items-center">
                        <span className="mr-2">🌐</span>
                        <a 
                          href={businessSettings.website.startsWith('http') ? businessSettings.website : `https://${businessSettings.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {businessSettings.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Informasjon</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    {businessSettings.bankAccount && (
                      <p>
                        <span className="text-slate-500">Kontonr:</span><br />
                        {businessSettings.bankAccount}
                      </p>
                    )}
                    {businessSettings.specializations && businessSettings.specializations.length > 0 && (
                      <p className="text-slate-500 text-xs mt-2">
                        {businessSettings.specializations.slice(0, 3).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center text-xs text-slate-500">
                <p>Dette tilbudet er utarbeidet av {businessSettings.companyName} og er gyldig til {new Date(quote.svarfrist).toLocaleDateString('nb-NO')}</p>
                {businessSettings.defaultQuoteNotes && (
                  <p className="mt-2 text-slate-400">{businessSettings.defaultQuoteNotes}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Powered by */}
        <div className="text-center text-xs text-slate-400 mt-4 mb-2">
          <p>Powered by Proanbud</p>
        </div>

        {/* Contact Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>Kontakt håndverker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Melding
                </label>
                <Textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Skriv din melding til håndverkeren..."
                  rows={4}
                  className="w-full"
                  disabled={contactSubmitting}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowContactDialog(false)}
                  variant="outline"
                  disabled={contactSubmitting}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleSendContactMessage}
                  disabled={contactSubmitting || !contactMessage.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {contactSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send melding
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default function TilbudsvisningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Laster tilbud...</p>
        </div>
      </div>
    }>
      <TilbudsvisningContent />
    </Suspense>
  );
}

