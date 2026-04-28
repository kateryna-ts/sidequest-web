import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_not_configured', request.url));
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/instagram/callback`;
  const params = new URLSearchParams({
    force_reauth: 'true',
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights',
  });

  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${params}`);
}
