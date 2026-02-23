/**
 * POST /api/auth/logout  (Next.js proxy)
 *
 * Clears the httpOnly auth cookies from the Next.js origin and notifies
 * the backend so it can perform any server-side session cleanup.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { bearerHeader, clearTokenCookies } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  // Best-effort backend notification — do not fail the logout if it errors
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeader(request),
      },
    });
  } catch {
    // Swallow — clearing local cookies is sufficient
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  clearTokenCookies(response);

  return response;
}
