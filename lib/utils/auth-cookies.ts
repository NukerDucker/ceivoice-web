/**
 * Auth cookie utilities (server-only)
 *
 * Helpers shared by Next.js API proxy routes to:
 *  - Extract the access_token / refresh_token from request cookies
 *  - Build the set-cookie headers when issuing / clearing tokens
 *  - Create the Authorization: Bearer header used when proxying to the backend
 */

import type { NextRequest, NextResponse } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const ACCESS_TOKEN_MAX_AGE  = 7  * 24 * 60 * 60; // 7 days
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// ── Readers ────────────────────────────────────────────────────────────────

export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('access_token')?.value;
}

export function getRefreshToken(request: NextRequest): string | undefined {
  return request.cookies.get('refresh_token')?.value;
}

/** Build an Authorization: Bearer header from the access_token cookie. */
export function bearerHeader(request: NextRequest): Record<string, string> {
  const token = getAccessToken(request);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Writers ────────────────────────────────────────────────────────────────

/** Set both tokens as httpOnly cookies on the given response. */
export function setTokenCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/** Clear both auth cookies (used on logout). */
export function clearTokenCookies(response: NextResponse): void {
  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ── JWT payload decoder (Edge-runtime safe — NO verification) ──────────────
//
// Used ONLY by the Next.js middleware for RBAC routing decisions.
// All actual token verification happens on the backend via Passport.js.

export type JwtPayload = {
  user_id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, base64Payload] = token.split('.');
    if (!base64Payload) return null;

    // Convert base64url → base64 then decode
    const padded = base64Payload.replaceAll('-', '+').replaceAll('_', '/');
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}
