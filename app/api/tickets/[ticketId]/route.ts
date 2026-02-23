// GET   /api/tickets/[ticketId]   — get ticket by id
// PATCH /api/tickets/[ticketId]   — update ticket
// DELETE /api/tickets/[ticketId]  — delete ticket

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const body = await request.json();
  const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
