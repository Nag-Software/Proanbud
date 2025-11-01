'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { confirmPasswordReset, getAuthErrorMessage } from '@/lib/auth';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Validate that we have the required parameters
    if (!oobCode || mode !== 'resetPassword') {
      setError('Ugyldig tilbakestillingslenke. Be om en ny lenke.');
    }
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oobCode) {
      setError('Ugyldig tilbakestillingslenke. Be om en ny lenke.');
      return;
    }

    if (password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await confirmPasswordReset(oobCode, password);

      if (resetError) {
        setError(getAuthErrorMessage(resetError));
      } else {
        setSuccess(true);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?message=Passordet ditt har blitt tilbakestilt. Du kan nå logge inn med det nye passordet.');
        }, 3000);
      }
    } catch (error) {
      setError('En uventet feil oppstod. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed left-5 top-5">
          <Logo size="lg" />
        </div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Passord tilbakestilt!</h1>
            <p className="text-muted-text">Du blir omdirigert til innloggingssiden...</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Vellykket!</h3>
                <p className="text-muted-foreground">
                  Ditt passord har blitt tilbakestilt. Du kan nå logge inn med det nye passordet.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  Gå til innlogging
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed left-5 top-5">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tilbakestill passord</h1>
          <p className="text-muted-text">Skriv inn ditt nye passord</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Lock className="w-5 h-5 text-primary" />
              Nytt passord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Nytt passord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Skriv inn nytt passord"
                    required
                    minLength={6}
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
                <label htmlFor="confirmPassword" className="text-sm font-medium">Bekreft nytt passord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Bekreft nytt passord"
                    required
                    minLength={6}
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

              <button
                type="submit"
                disabled={loading || !oobCode || mode !== 'resetPassword'}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Tilbakestiller passord...' : 'Tilbakestill passord'}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-base text-muted-foreground">
            Husker du passordet ditt?{' '}
            <Link href="/login" className="underline hover:no-underline">
              Logg inn
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}