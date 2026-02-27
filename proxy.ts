import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type AppRole = 'user' | 'assignee' | 'admin';

const PUBLIC_PATHS = ['/login', '/register', '/auth-success', '/onboarding', '/auth/confirm'];

const ROLE_ROUTES: Record<string, AppRole> = {
  '/user':     'user',
  '/assignee': 'assignee',
  '/admin':    'admin',
};

function isPublic(pathname: string, search: URLSearchParams): boolean {
  if (search.get('type') === 'recovery') return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl;

  if (isPublic(pathname, searchParams)) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Reads session from cookie — no network call.
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL('/login', origin);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Custom claims injected by custom_access_token_hook postgres function.
  const claims = session.user.user_metadata as Record<string, unknown>;
  const appRole = (session.access_token
    ? (JSON.parse(atob(session.access_token.split('.')[1])) as Record<string, unknown>).app_role
    : claims.app_role) as string | undefined;
  const onboardingDone = (session.access_token
    ? (JSON.parse(atob(session.access_token.split('.')[1])) as Record<string, unknown>).onboarding_completed
    : false) as boolean;

  if (!onboardingDone && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', origin));
  }

  const requiredRole = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (requiredRole && appRole !== requiredRole) {
    const dest = appRole ? `/${appRole}/dashboard` : '/login';
    return NextResponse.redirect(new URL(dest, origin));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
