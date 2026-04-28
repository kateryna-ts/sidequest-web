import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: !!process.env.INSTAGRAM_APP_ID });
}
