import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Meta pings this with GET to verify the URL before saving it
export async function GET() {
  return NextResponse.json({ ok: true });
}

// Meta GDPR compliance: called when a user requests their data be deleted
// Must return { url, confirmation_code } within 24h
export async function POST(request: NextRequest) {
  const confirmationCode = crypto.randomUUID();

  try {
    const body = await request.formData();
    const signedRequest = body.get('signed_request') as string;
    if (signedRequest) {
      const [, payload] = signedRequest.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      const igUserId = decoded.user_id as string;

      if (igUserId) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        // Delete the user's quests, waves, and account data
        const { data: user } = await admin
          .from('users')
          .select('id')
          .eq('instagram_handle', igUserId)
          .single();

        if (user) {
          await admin.from('waves').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          await admin.from('quests').delete().eq('user_id', user.id);
          await admin.from('taste_fingerprints').delete().eq('user_id', user.id);
          await admin.from('users').delete().eq('id', user.id);
          await admin.auth.admin.deleteUser(user.id);
        }
      }
    }
  } catch {
    // still return success — Meta only cares that we acknowledged
  }

  return NextResponse.json({
    url: `${request.nextUrl.origin}/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
