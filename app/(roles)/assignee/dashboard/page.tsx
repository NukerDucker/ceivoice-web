// Assignee dashboard — tickets assigned to me

import { TicketList } from '@/components/tickets/TicketTable';
import { Header } from '@/components/tickets/TicketListHeader';
import { mockTickets } from '@/lib/constants';

export default function AssigneeDashboardPage() {
  return (
    <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <Header />
      </div>
      <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
        {/* TODO: filter tickets assigned to current user */}
        <TicketList data={mockTickets} />
      </div>
    </div>
  );
}
