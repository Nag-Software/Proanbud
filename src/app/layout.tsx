

import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContextNew';
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Script from "next/script";

import { Analytics } from "@vercel/analytics/next"


const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Proanbud",
  description: "Norges første KI-drevne tilbudssystem for byggebransjen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  <Analytics/>

  return (
    <html lang="no">
      <head>
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Norges første KI-drevne tilbudssystem for byggebransjen" />
        <Script id="facebook-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push
          (arguments)}; if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!
          0;n.version='2.0';n.queue=[];t=b.createElement(e);
          t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '721076847281663');
          fbq('track', 'PageView');
        `}} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=721076847281663&ev=PageView&noscript=1" />` }} />
        <Script id="tiktok-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
            ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


              ttq.load('D54O22RC77U40DIQG260');
              ttq.page();
          }(window, document, 'ttq');
        `}} />
      </head>
      <body className={`${geist.variable} ${lora.variable} font-serif bg-background text-foreground overflow-x-hidden`} suppressHydrationWarning>
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
