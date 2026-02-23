/**
 * Auth + role middleware helpers
 *
 * Reads the access_token httpOnly cookie that was set by the Next.js
 * /api/auth/* proxy routes, decodes the JWT payload (no network call needed),
 * and enforces role-based access control for all protected routes.
 *
 * NOTE: We decode the JWT here without cryptographic verification because:
 *  a) The cookie is httpOnly — client JS cannot tamper with it
 *  b) Every real API call goes through a backend route that DOES verify the JWT
 *  c) Next.js middleware runs on the Edge, where full JWT libs are heavy
 *
 * The role string in the JWT matches the backend's Prisma enum: USER | ASSIGNEE | ADMIN
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/utils/auth-cookies';

export type Role = 'user' | 'assignee' | 'admin';

/** Protected route prefix → required role (case-insensitive match) */
const ROLE_ROUTES: Record<string, Role> = {
  '/user':     'user',
  '/assignee': 'assignee',
  '/admin':    'admin',
};

/**
 * Decodes the access_token cookie and returns the normalised role string.
 * Returns null if the cookie is absent or the token is malformed / expired.
 */
export async function getRoleFromRequest(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Check token expiry (exp is seconds-since-epoch)
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;

  const role = payload.role?.toLowerCase() as Role | undefined;
  // Map backend roles → frontend route roles
  if (role === 'admin' || role === 'assignee' || role === 'user') return role;

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
    // Not authenticated — send to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userRole !== requiredRole) {
    // Wrong role — send to their own dashboard
    return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
  }

  return null;
}
