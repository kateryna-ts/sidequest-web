import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const stateParam = searchParams.get('state');

  if (errorParam || !code) {
    return NextResponse.redirect(new URL('/sign-in?error=instagram_failed', request.url));
  }

  // Parse optional state (connect mode: linking Instagram to existing Supabase user)
  let connectToken: string | null = null;
  let connectRedirectTo = `${origin}/profile`;
  if (stateParam) {
    try {
      const parsed = JSON.parse(atob(stateParam));
      if (parsed.mode === 'connect' && parsed.token) {
        connectToken = parsed.token;
        connectRedirectTo = parsed.redirectTo ?? `${origin}/profile`;
      }
    } catch {}
  }

  const appId = process.env.INSTAGRAM_APP_ID!.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET!.trim();
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  // Exchange code for access token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error_type || !tokenData.access_token) {
    const dest = connectToken
      ? `${connectRedirectTo}?error=instagram_failed`
      : '/sign-in?error=instagram_failed';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Get Instagram profile
  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${tokenData.access_token}`,
  );
  const igUser = await profileRes.json();
  if (!igUser.id) {
    const dest = connectToken
      ? `${connectRedirectTo}?error=instagram_failed`
      : '/sign-in?error=instagram_failed';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Connect mode: link Instagram to existing Supabase user ───────────────────
  if (connectToken) {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${connectToken}` } },
    });
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in?error=session_expired', request.url));
    }

    const updates: Record<string, string> = {
      instagram_handle: igUser.username ?? igUser.id,
    };
    if (igUser.name) updates.display_name = igUser.name;
    if (igUser.profile_picture_url) updates.avatar_url = igUser.profile_picture_url;

    await client.from('users').update(updates).eq('id', user.id);

    // Kick off personality analysis asynchronously
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const admin = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      admin.functions.invoke('analyze-personality', { body: { user_id: user.id } }).catch(() => {});
    }

    return NextResponse.redirect(new URL(`${connectRedirectTo}?connected=1`, request.url));
  }

  // ── Sign-in mode: create/sign in via synthetic email ─────────────────────────
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return NextResponse.redirect(new URL('/sign-in?error=server_config', request.url));
  }

  const syntheticEmail = `ig_${igUser.id}@ig.sidequest.app`;
  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirectTo = `${origin}/auth/callback?ig_handle=${encodeURIComponent(igUser.username ?? '')}&ig_access_token=${encodeURIComponent(tokenData.access_token)}`;
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
