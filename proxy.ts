import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from './src/lib/firebaseAdmin';
import { getUserSubscriptions } from './src/utils/subscription';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token
    const decodedToken = await auth?.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const uid = decodedToken.uid;

    // Check subscription status
    const subscriptions = await getUserSubscriptions(uid);
    const hasActiveSubscription = Object.values(subscriptions).some(sub =>
      sub.status === 'active' || sub.status === 'trialing'
    );

    // If accessing protected routes and no active subscription, redirect to upgrade
    if (!hasActiveSubscription && isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-uid', uid);
    response.headers.set('x-user-has-subscription', hasActiveSubscription.toString());

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/api/protected',
    // Add more protected routes here
  ];

  return protectedRoutes.some(route => pathname.startsWith(route));
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};