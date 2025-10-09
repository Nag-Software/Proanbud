

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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans bg-background text-foreground`}>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
