import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('sq-session');
  if (!hasSession) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/feed/:path*', '/compose/:path*', '/waves/:path*', '/profile/:path*', '/onboarding/:path*'],
};
