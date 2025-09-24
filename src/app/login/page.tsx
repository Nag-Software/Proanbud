'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { loginWithEmail, getAuthErrorMessage } from '@/lib/auth';
import { LogIn, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, error: authError } = await loginWithEmail(email, password);

    if (authError) {
      setError(getAuthErrorMessage(authError));
    } else if (user) {
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed left-5 top-5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <Icons.ShieldCheck className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-text">Proanbud</span>
        </div>
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
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

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