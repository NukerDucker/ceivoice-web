/**
 * POST /api/auth/refresh  (Next.js proxy)
 *
 * Reads the refresh_token httpOnly cookie, exchanges it for a new access_token
 * via the backend, then updates the access_token cookie.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRefreshToken, setTokenCookies, ACCESS_TOKEN_MAX_AGE } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  const refreshToken = getRefreshToken(request);

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendRes.json() as {
      accessToken?: string;
      user?: object;
      error?: string;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Session expired' },
        { status: backendRes.status }
      );
    }

    const { accessToken, user } = data as { accessToken: string; user: object };

    const response = NextResponse.json({ user }, { status: 200 });

    const isProduction = process.env.NODE_ENV === 'production';

    // Update only the access_token; refresh_token stays the same
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/refresh]', err);
    return NextResponse.json({ error: 'Session refresh failed' }, { status: 500 });
  }
}
