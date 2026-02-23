/**
 * Next.js Middleware — runs on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the auth session cookie (if using Supabase SSR / token rotation).
 *  2. Enforce role-based access: redirect unauthenticated or wrong-role users.
 *
 * Protected prefixes:
 *  /user/*      → requires role "user"
 *  /assignee/*  → requires role "assignee"
 *  /admin/*     → requires role "admin"
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforceRoleAccess } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Role-based access control
  const roleRedirect = await enforceRoleAccess(request);
  if (roleRedirect) return roleRedirect;

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     *  - _next/static (static files)
     *  - _next/image  (image optimisation)
     *  - favicon.ico
     *  - public folder assets
     *  - /login, /register, /auth-success, /callback (publicly accessible)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$|login|register|auth-success|callback).*)',
  ],
};
