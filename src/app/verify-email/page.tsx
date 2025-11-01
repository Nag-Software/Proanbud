'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail, getAuthErrorMessage } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const verifyEmailAddress = async () => {
      const oobCode = searchParams.get('oobCode');

      if (!oobCode) {
        setStatus('error');
        setErrorMessage('Ugyldig verifiseringslenke');
        return;
      }

      try {
        const { error } = await verifyEmail(oobCode);

        if (error) {
          setStatus('error');
          setErrorMessage(getAuthErrorMessage(error) || 'Kunne ikke verifisere e-posten');
        } else {
          setStatus('success');
          setShowAnimation(true);
          
          // Redirect to dashboard after showing success animation
          setTimeout(() => {
            const continueUrl = searchParams.get('continueUrl');
            if (continueUrl) {
              // Parse the continue URL and extract the path
              try {
                const url = new URL(continueUrl);
                router.push(url.pathname);
              } catch {
                router.push('/dashboard');
              }
            } else {
              router.push('/dashboard');
            }
          }, 2500);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('En uventet feil oppstod');
      }
    };

    verifyEmailAddress();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed left-5 top-5">
        <Logo size="lg" />
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              E-postverifisering
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">Verifiserer e-post...</h3>
                  <p className="text-muted-foreground">
                    Vennligst vent mens vi verifiserer din e-postadresse
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Outer circle animation */}
                    {showAnimation && (
                      <div className="w-32 h-32 rounded-full bg-green-100 animate-[ping_1s_ease-in-out_1]"></div>
                    )}
                    {/* Main circle */}
                    <div className={`absolute inset-0 w-32 h-32 rounded-full bg-green-500 flex items-center justify-center ${showAnimation ? 'animate-[scale-in_0.3s_ease-out]' : ''}`}>
                      {/* Checkmark with draw animation */}
                      <Check className={`w-16 h-16 text-white ${showAnimation ? 'animate-[scale-in_0.5s_ease-out_0.2s_both]' : ''}`} strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div className={`space-y-2 ${showAnimation ? 'animate-[fade-in_0.5s_ease-out_0.4s_both]' : ''}`}>
                  <h3 className="text-2xl font-semibold text-foreground">E-post verifisert!</h3>
                  <p className="text-muted-foreground">
                    Din e-postadresse er nå bekreftet. Omdirigerer til dashboard...
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">Verifisering feilet</h3>
                  <p className="text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/signup">
                      Prøv på nytt
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                      Gå til innlogging
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
