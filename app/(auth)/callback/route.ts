// OAuth callback handler
// Exchanges the auth code for a session and redirects based on role

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // TODO: Exchange code for session using your auth provider
    // e.g. Supabase: await supabase.auth.exchangeCodeForSession(code)
    // Then redirect based on role
    return NextResponse.redirect(`${origin}${next}`);
  }

  // If no code, redirect to error page
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
