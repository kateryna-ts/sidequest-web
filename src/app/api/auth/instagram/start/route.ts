import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  if (!appId) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_not_configured', request.url));
  }

  const { origin, searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  // Encode optional Supabase token + mode in OAuth state so callback can link accounts
  const state = token
    ? btoa(JSON.stringify({ token, mode: 'connect', redirectTo: `${origin}/profile` }))
    : '';

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${origin}/api/auth/instagram/callback`,
    response_type: 'code',
    scope: 'instagram_business_basic',
    ...(state ? { state } : {}),
  });

  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${params}`);
}
