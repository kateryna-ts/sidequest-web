import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  if (errorParam || !code) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_failed', request.url));
  }

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Exchange code for access token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: `${origin}/api/auth/instagram/callback`,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error_type || !tokenData.access_token) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_failed', request.url));
  }

  // Get Instagram user profile
  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`,
  );
  const igUser = await profileRes.json();
  if (!igUser.id) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_failed', request.url));
  }

  // Use a stable synthetic email to identify this Instagram account in Supabase auth
  const syntheticEmail = `ig_${igUser.id}@ig.sidequest.app`;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Generate a magic link (creates user if they don't exist)
  const redirectTo = `${origin}/auth/callback?ig_handle=${encodeURIComponent(igUser.username)}&ig_access_token=${encodeURIComponent(tokenData.access_token)}`;
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: syntheticEmail,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_failed', request.url));
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
