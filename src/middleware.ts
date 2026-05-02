import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set these in .env.local for development and Vercel env vars for production.
// APP_HOST      = app.localhost:3000 | app.proanbud.no
// MARKETING_HOST= localhost:3000     | proanbud.no
const APP_HOST = process.env.APP_HOST || 'app.localhost:3000';
const MARKETING_HOST = process.env.MARKETING_HOST || 'localhost:3000';

// Routes that belong to the app host (app.proanbud.no)
const APP_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/tilbudsvisning',
  '/dashboard',
  '/innboks',
  '/innstillinger',
  '/katalog',
  '/prislister',
  '/kunder',
  '/tilbud',
  '/bedrift',
];

// Routes that belong to the marketing host (proanbud.no)
const MARKETING_ROUTES = [
  '/blogg',
  '/priser',
  '/om-oss',
  '/kalkulator',
  '/pilot',
  '/pilotavtale',
  '/fromad',
  '/cookies',
  '/personvern',
  '/tilgjengelighet',
  '/vilkar',
];

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const { pathname } = req.nextUrl;

  const isAppHost = hostname === APP_HOST;
  const isMarketingHost = hostname === MARKETING_HOST;

  // Pass through for API routes, Next.js internals, static files, and Sanity studio
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAppRoute = APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isMarketingRoute = MARKETING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isAppHost) {
    // On app host: redirect marketing routes to marketing host
    if (isMarketingRoute) {
      return NextResponse.redirect(`http://${MARKETING_HOST}${pathname}`);
    }
    // On app host: / → /login
    if (pathname === '/') {
      return NextResponse.redirect(`http://${APP_HOST}/login`);
    }
  }

  if (isMarketingHost) {
    // On marketing host: redirect app routes to app host
    if (isAppRoute) {
      return NextResponse.redirect(`http://${APP_HOST}${pathname}`);
    }
    // On marketing host: / is the homepage, let it through
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icons|logo|assets|socials).*)'],
};
