/**
 * Auth + role middleware helpers
 *
 * Used by /middleware.ts to refresh sessions and enforce role-based access.
 *
 * TODO: Integrate with your auth provider (Supabase, custom JWT, etc.)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type Role = 'user' | 'assignee' | 'admin';

/** Protected route prefix → required role */
const ROLE_ROUTES: Record<string, Role> = {
  '/user':     'user',
  '/assignee': 'assignee',
  '/admin':    'admin',
};

/**
 * Check the request's auth cookie and return the user's role.
 * Returns null if unauthenticated.
 */
export async function getRoleFromRequest(_request: NextRequest): Promise<Role | null> {
  // TODO: Verify JWT from httpOnly cookie and extract role claim.
  // Example using jose:
  //   const token = request.cookies.get('access_token')?.value;
  //   if (!token) return null;
  //   const { payload } = await jwtVerify(token, secret);
  //   return payload.role as Role;
  return null;
}

/**
 * Returns a redirect response if the user's role doesn't match the route,
 * or null if access is allowed.
 */
export async function enforceRoleAccess(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const requiredRole = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (!requiredRole) return null; // public route

  const userRole = await getRoleFromRequest(request);
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (userRole !== requiredRole) {
    return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
  }

  return null;
}
