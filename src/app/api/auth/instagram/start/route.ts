import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_not_configured', request.url));
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/instagram/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'instagram_business_basic',
    response_type: 'code',
  });

  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${params}`);
}
