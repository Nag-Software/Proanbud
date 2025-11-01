'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { signupWithEmail, getAuthErrorMessage } from '@/lib/auth';
import { updateProfile } from 'firebase/auth';
import { UserPlus, Eye, EyeOff, Mail, Lock, User, CheckCircle, Building, ArrowRight, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface Business {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  hjemmeside?: string;
  postadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
  };
}

function SignupForm() {
  const [currentTab, setCurrentTab] = useState('business');
  const [businessSearch, setBusinessSearch] = useState('');
  const [businessResults, setBusinessResults] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [searching, setSearching] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Status messages
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | ''>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if this is a password reset request and redirect
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      // Redirect to the reset-password page with all parameters
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/reset-password?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Status message component
  const StatusMessage = ({ message, type }: { message: string; type: 'success' | 'error' | 'info' | '' }) => {
    if (!message || !type) return null;

    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-700',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
      <div className={`border px-4 py-3 rounded-md text-base ${styles[type]}`}>
        {message}
      </div>
    );
  };

  // Helper function for status messages
  const setStatus = (message: string, type: 'success' | 'error' | 'info' | '' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    if (type === 'error') {
      setError(message);
    } else {
      setError('');
    }
  };

  // Business search function
  const searchBusiness = async (query: string) => {
    if (query.length < 3) {
      setBusinessResults([]);
      return;
    }

    setSearching(true);
    try {
      // Check if it's an org number (9 digits)
      const isOrgNumber = /^\d{9}$/.test(query.replace(/\s/g, ''));
      const url = isOrgNumber
        ? `https://data.brreg.no/enhetsregisteret/api/enheter/${query.replace(/\s/g, '')}`
        : `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query)}&size=10`;

      const response = await fetch(url);
      if (response.ok) {
        const data = isOrgNumber ? [await response.json()] : (await response.json())._embedded?.enheter || [];
        setBusinessResults(data);
      } else {
        setBusinessResults([]);
      }
    } catch (error) {
      console.error('Error searching business:', error);
      setBusinessResults([]);
    }
    setSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBusiness(businessSearch);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [businessSearch]);

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setBusinessSearch(business.navn);
    setBusinessResults([]);
  };

  const canProceedToUserInfo = true;
  const canSubmit = name && email && password && confirmPassword && password === confirmPassword && password.length >= 6 && acceptTerms;

  const handleCreateAccount = async () => {
    if (!canSubmit) return;
    
    setLoading(true);
    setStatus('Oppretter konto...', 'info');

    try {
      // Prepare business settings if a business was selected
      const businessSettings = selectedBusiness ? {
        companyName: selectedBusiness.navn,
        organizationNumber: selectedBusiness.organisasjonsnummer,
        businessType: selectedBusiness.organisasjonsform.beskrivelse
      } : undefined;

      const { user, error: authError } = await signupWithEmail(email, password, name, businessSettings);

      if (authError) {
        console.error('Signup error:', authError);
        const errorMessage = getAuthErrorMessage(authError);
        setStatus(errorMessage, 'error');

        // Special handling for email already in use
        if (authError === 'auth/email-already-in-use') {
          setStatus('Det finnes allerede en konto med denne e-postadressen. Prøv å logg inn i stedet.', 'error');
        }
        setLoading(false);
        return;
      }

      if (user) {
        console.log('User created successfully:', user.uid);
        
        // Show success animation
        setShowSuccessAnimation(true);
        setStatus('Konto opprettet! Omdirigerer...', 'success');
        
        // Wait for animation to complete, then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setStatus('En uventet feil oppstod. Prøv igjen.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed left-5 top-5">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Godt å se deg</h1>
          <p className="text-muted-text">Kom i gang med din Proanbud-konto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <UserPlus className="w-5 h-5" />
              Lag en konto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="business" disabled={currentTab !== 'business' && !canProceedToUserInfo} className="text-base">
                  Bedrift
                </TabsTrigger>
                <TabsTrigger value="user" disabled={!canProceedToUserInfo} className="text-base">
                  Bruker
                </TabsTrigger>
              </TabsList>

              <TabsContent value="business" className="space-y-4">
                <div id="business-search-container" className="space-y-2 relative">
                  <label htmlFor="business-search" className="text-sm font-medium">
                    Søk etter bedrift <span className="text-muted-foreground font-normal">(valgfritt)</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="business-search"
                      type="text"
                      value={businessSearch}
                      onChange={(e) => setBusinessSearch(e.target.value)}
                      className="pl-10 text-sm"
                      placeholder="Skriv inn organisasjonsnummer eller bedriftsnavn"
                    />
                    {searching && (
                      <div className="absolute right-3 top-2.5">
                        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {businessResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                      {businessResults.map((business) => (
                        <button
                          key={business.organisasjonsnummer}
                          onClick={() => handleBusinessSelect(business)}
                          className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{business.navn}</div>
                          <div className="text-sm text-muted-foreground">
                            Org.nr: {business.organisasjonsnummer} • {business.organisasjonsform.beskrivelse}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected business display */}
                {selectedBusiness && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{selectedBusiness.navn}</p>
                        <p className="text-sm text-green-700">
                          Org.nr: {selectedBusiness.organisasjonsnummer}
                        </p>
                        <p className="text-sm text-green-700">
                          Type: {selectedBusiness.organisasjonsform.beskrivelse}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBusiness(null);
                          setBusinessSearch('');
                        }}
                        className="text-green-600 hover:text-green-800 text-sm underline"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setCurrentTab('user')}
                  disabled={!canProceedToUserInfo}
                  className="w-full"
                >
                  {selectedBusiness ? 'Neste med bedriftsinformasjon' : 'Hopp over'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </TabsContent>

              <TabsContent value="user" className="space-y-4">
                <StatusMessage message={statusMessage} type={statusType} />

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Fullt Navn</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      placeholder="Skriv inn ditt fulle navn"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">E-post</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="Skriv inn e-posten din"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Passord</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12"
                      placeholder="Opprett et passord"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Bekreft Passord</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-12"
                      placeholder="Bekreft passordet ditt"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm">
                    Jeg godtar{' '}
                    <Link href="/vilkar" className="underline hover:no-underline">
                      vilkårene og betingelsene
                    </Link>
                  </label>
                </div>

                {showSuccessAnimation ? (
                  // Success animation
                  <div className="text-center space-y-6 py-8">
                    <div className="flex justify-center">
                      <div className="relative">
                        {/* Outer circle animation */}
                        <div className="w-32 h-32 rounded-full bg-green-100 animate-[ping_1s_ease-in-out_1]"></div>
                        {/* Main circle */}
                        <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                          {/* Checkmark with draw animation */}
                          <Check className="w-16 h-16 text-white animate-[scale-in_0.5s_ease-out_0.2s_both]" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 animate-[fade-in_0.5s_ease-out_0.4s_both]">
                      <h3 className="text-2xl font-semibold text-foreground">Velkommen!</h3>
                      <p className="text-muted-foreground">Omdirigerer til dashboard...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <StatusMessage message={statusMessage} type={statusType} />
                    
                    <Button
                      onClick={handleCreateAccount}
                      disabled={!canSubmit || loading}
                      className="w-full py-3 text-base font-medium"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Oppretter konto...
                        </>
                      ) : (
                        <>
                          Opprett konto
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-text">
                Har du allerede en konto?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Logg inn
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed left-5 top-5">
          <Logo size="lg" />
        </div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Laster...</h1>
          </div>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}