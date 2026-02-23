/**
 * POST /api/auth/login  (Next.js proxy)
 *
 * Forwards credentials to the backend, then stores the returned JWT tokens
 * as httpOnly cookies on the Next.js domain and returns only the user profile
 * to the client — tokens are never exposed to browser JavaScript.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setTokenCookies } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json() as {
      accessToken?: string;
      refreshToken?: string;
      user?: object;
      error?: string;
      message?: string;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error ?? data.message ?? 'Login failed' },
        { status: backendRes.status }
      );
    }

    const { accessToken, refreshToken, user } = data as {
      accessToken: string;
      refreshToken: string;
      user: object;
    };

    // Return only the user — never expose raw tokens to the browser
    const response = NextResponse.json({ user }, { status: 200 });
    setTokenCookies(response, accessToken, refreshToken);

    return response;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
