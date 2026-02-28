import { TicketList, type Ticket } from '@/components/tickets/TicketTable';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/tickets/TicketListHeader';
import type { ApiTicket } from '@/types/api';
import { createClient } from '@/lib/supabase/server';

const statusMap: Record<string, Ticket['status']> = {
  Draft: 'submitted', New: 'submitted',
  Assigned: 'in-progress', Solving: 'in-progress', Renew: 'in-progress',
  Solved: 'resolved', Failed: 'critical',
};

function toTicket(t: ApiTicket): Ticket {
  const displayName = t.assignee?.full_name ?? t.assignee?.user_name ?? null;
  return {
    ticketId: `TD-${String(t.ticket_id).padStart(6, '0')}`,
    title: t.title,
    category: t.category?.name ?? null,
    date: new Date(t.created_at),
    status: statusMap[t.status?.name ?? ''] ?? 'submitted',
    assignee: displayName
      ? { name: displayName, fallback: displayName.slice(0, 2).toUpperCase() }
      : undefined,
  };
}

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const raw = await apiFetch<ApiTicket[]>('/tickets/mine');
  const tickets = raw.map(toTicket);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <Header userEmail={user?.email} userId={user?.id} />
        </div>

        <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
          <TicketList data={tickets} />
        </div>
      </div>
    </div>
  );
}
