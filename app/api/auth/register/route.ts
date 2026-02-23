/**
 * POST /api/auth/register  (Next.js proxy)
 *
 * Forwards registration data to the backend, sets httpOnly auth cookies,
 * and returns only the user profile — tokens never reach the browser.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setTokenCookies } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${API_URL}/auth/register`, {
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
        { error: data.error ?? data.message ?? 'Registration failed' },
        { status: backendRes.status }
      );
    }

    const { accessToken, refreshToken, user } = data as {
      accessToken: string;
      refreshToken: string;
      user: object;
    };

    const response = NextResponse.json({ user }, { status: 201 });
    setTokenCookies(response, accessToken, refreshToken);

    return response;
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
