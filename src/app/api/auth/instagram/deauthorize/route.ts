import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Meta pings this with GET to verify the URL before saving it
export async function GET() {
  return NextResponse.json({ ok: true });
}

// Called by Meta when a user deauthorizes the app on Instagram
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const signedRequest = body.get('signed_request') as string;
    if (!signedRequest) return NextResponse.json({ ok: false }, { status: 400 });

    // Decode the payload (base64url second part)
    const [, payload] = signedRequest.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    const igUserId = decoded.user_id as string;
    if (!igUserId) return NextResponse.json({ ok: false }, { status: 400 });

    // Remove Instagram connection from the user record
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await admin
      .from('users')
      .update({ instagram_handle: null, instagram_token: null })
      .eq('instagram_handle', igUserId);
  } catch {
    // swallow — Meta doesn't retry on errors
  }

  return NextResponse.json({ ok: true });
}
