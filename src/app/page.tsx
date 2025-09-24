
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { ShieldCheck, BarChart3, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show redirecting message
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-text mb-4">Omdirigerer til dashbordet...</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Gå til dashbordet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Proanbud</span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/login"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Logg inn
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Kom igang
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Send profesjonelle tilbud rett fra mobilen, med
                <span className="italic"> AI</span>
              </h1>
              <p className="text-xl text-muted-text mb-8">
                Din komplette tilbudsplatform for håndverkere som ønsker å effektivisere
                anbudsprosessen og vinne flere oppdrag ved hjelp av AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground border border-primary px-8 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium text-lg"
                >
                  Kom igang
                </Link>
              </div>
            </div>
            
            {/* Hero Image Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="bg-card rounded-3xlshadow-lg">
                  <div className="overflow-hidden rounded-3xl">
                    <img
                      src="/assets/1.jpg"
                      alt="Proanbud platform overview"
                      className="w-full h-auto max-w-lg object-cover"
                    />
                  </div>
                </div>
                {/* Subtle background accent */}
                <div className="absolute -top-4 -right-4 w-full h-full bg-accent/10 rounded-2xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Kraftfulle Funksjoner
            </h2>
            <p className="text-lg text-muted-text">
              Alt du trenger for å sende tilbud raskt og profesjonelt, <span className="italic">til riktig pris</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-text">
                  Comprehensive analytics and reporting tools to track your business performance
                  with real-time data visualization.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-text">
                  Manage your team and user access with role-based permissions
                  and secure authentication.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Growth Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-text">
                  Get actionable insights and recommendations to drive your business
                  growth and optimize operations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
