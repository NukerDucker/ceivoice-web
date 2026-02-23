// GET /api/users — list all users (admin only)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { bearerHeader } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  const res = await fetch(`${API_URL}/users`, {
    headers: { ...bearerHeader(request) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
