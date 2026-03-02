/**
 * lib/auth-cookies.ts
 * Server-side helper for Route Handlers — extracts the Supabase session
 * from request cookies and returns an Authorization header object.
 */
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function bearerHeader(
  request: NextRequest,
): Promise<{ Authorization?: string }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    },
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}
