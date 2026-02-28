// ceivoice-web/proxy.ts (or middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type AppRole = 'user' | 'assignee' | 'admin';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/auth-success',
  '/onboarding',
  '/auth/confirm',
  '/auth/callback', //
  '/test',
];

const ROLE_HIERARCHY: Record<AppRole, number> = {
  user: 0,
  assignee: 1,
  admin: 2,
};

const ROLE_ROUTES: Record<string, AppRole> = {
  '/user':     'user',
  '/assignee': 'assignee',
  '/admin':    'admin',
};

function isPublic(pathname: string, search: URLSearchParams): boolean {
  if (search.get('type') === 'recovery') return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasAccess(userRole: AppRole, required: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    const url = new URL('/login', origin);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token
    ? JSON.parse(atob(session.access_token.split('.')[1]))
    : {};
  const appRole = (jwt.app_role ?? 'user') as AppRole;
  const onboardingDone = (jwt.onboarding_completed ?? false) as boolean;

  if (onboardingDone && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }
  // Onboarding gate
  if (!onboardingDone && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', origin));
  }

  if (pathname === '/dashboard') {
  return NextResponse.redirect(new URL(`/${appRole}/dashboard`, origin));
  }
  // Role gate
  const requiredRole = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (requiredRole && !hasAccess(appRole, requiredRole)) {
    return NextResponse.redirect(new URL(`/${appRole}/dashboard`, origin));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
