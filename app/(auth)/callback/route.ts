/**
 * OAuth callback route — token exchange to httpOnly cookies
 *
 * The backend's Passport.js Google OAuth handler redirects here with:
 *   /callback?access_token=<jwt>&refresh_token=<jwt>
 *
 * This route handler:
 *  1. Reads the tokens from the URL search params
 *  2. Stores them as httpOnly cookies on the Next.js origin (so they are
 *     usable by the middleware and Next.js API proxy routes)
 *  3. Redirects to /auth-success with NO tokens in the final URL
 *
 * The httpOnly flag means client-side JavaScript cannot access the tokens
 * — only the browser and server-side code can.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// How long each cookie lives (must match the JWT expiry configured in the backend)
const ACCESS_TOKEN_MAX_AGE  = 7  * 24 * 60 * 60; // 7 days  (JWT_ACCESS_TOKEN_EXPIRY)
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days (JWT_REFRESH_TOKEN_EXPIRY)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken  = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Redirect to /auth-success — tokens will no longer appear in the URL
  const response = NextResponse.redirect(`${origin}/auth-success`);

  const isProduction = process.env.NODE_ENV === 'production';

  // access_token — short-lived, used in every API proxy request
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // refresh_token — long-lived, used only to obtain a new access_token
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}
