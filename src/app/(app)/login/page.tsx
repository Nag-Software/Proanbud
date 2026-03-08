'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { loginWithEmail, getAuthErrorMessage } from '@/lib/auth';
import { LogIn, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Status messages
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | ''>('');

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
    if (type === 'success') {
      setSuccess(message);
    } else {
      setSuccess('');
    }
  };

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setStatus(message, 'success');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('', '');
    setLoading(true);

    setStatus('Logger inn...', 'info');

    try {
      const { user, error: authError } = await loginWithEmail(email, password);

      if (authError) {
        const errorMessage = getAuthErrorMessage(authError);
        setStatus(errorMessage, 'error');
      } else if (user) {
        setStatus('Innlogging vellykket! Omdirigerer...', 'success');
        // Small delay to show success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      setStatus('En uventet feil oppstod. Prøv igjen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-dashboard>
      <div className="fixed left-5 top-5">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Velkommen tilbake</h1>
          <p className="text-muted-text">Logg inn på din Proanbud-konto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <LogIn className="w-5 h-5 text-primary" />
              Logg inn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <StatusMessage message={statusMessage} type={statusType} />

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  E-post
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                    placeholder="Skriv inn e-posten din"
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Passord
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                    placeholder="Skriv inn passordet ditt"
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Glemt passord?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Logger inn...' : 'Logg inn'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-text">
                Har du ikke en konto?{' '}
                <Link
                  href="/signup"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Registrer deg
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-dashboard>
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
      <LoginForm />
    </Suspense>
  );
}