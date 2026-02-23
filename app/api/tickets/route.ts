// GET /api/tickets   — list all tickets
// POST /api/tickets  — create a new ticket

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { bearerHeader } from '@/lib/utils/auth-cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  const res = await fetch(`${API_URL}/tickets`, {
    headers: { ...bearerHeader(request) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...bearerHeader(request),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
