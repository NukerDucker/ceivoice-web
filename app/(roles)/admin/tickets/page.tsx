'use client';

import { TicketList } from '@/components/tickets/TicketCard';
import { mockTickets } from '@/lib/constants';
import { Header } from '@/components/tickets/TicketListHeader';

export default function Page() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <Header />
        </div>

        <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
          <TicketList data={mockTickets} />
        </div>
      </div>
    </div>
  );
}