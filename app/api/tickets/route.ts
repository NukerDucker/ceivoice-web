// ceivoice-web/app/api/tickets/route.ts
import { apiFetch } from '@/lib/utils/api';

export async function GET() {
  const res = await apiFetch('/tickets');
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}