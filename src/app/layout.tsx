

import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
        <link rel="icon" href="favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-drevet tilbudssystem for håndverkere" />
      </head>
      <body className={`${spaceGrotesk.variable} font-sans bg-background text-foreground`} suppressHydrationWarning>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
