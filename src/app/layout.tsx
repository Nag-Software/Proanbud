

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContextNew';
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Proanbud",
  description: "AI-drevet tilbudssystem for håndverkere",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="no">
      <head>
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-drevet tilbudssystem for håndverkere" />
      </head>
      <body className={`${geist.variable} font-sans bg-background text-foreground overflow-x-hidden`} suppressHydrationWarning>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
