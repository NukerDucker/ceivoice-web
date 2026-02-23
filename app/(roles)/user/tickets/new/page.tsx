// Submit a new ticket

import { CreateTicketModal } from '@/components/tickets/ReplyBox';

export default function NewTicketPage() {
  return (
    <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Submit a Ticket</h1>
      <CreateTicketModal />
    </div>
  );
}
