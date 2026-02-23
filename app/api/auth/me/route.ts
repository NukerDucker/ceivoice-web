/**
 * GET /api/auth/me  (Next.js proxy)
 *
 * Reads the access_token httpOnly cookie and forwards the request to the
 * backend's /auth/me with an Authorization: Bearer header.
 * Returns the current user's profile, or 401 if not authenticated.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { bearerHeader, getAccessToken } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  const token = getAccessToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeader(request),
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[/api/auth/me]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
