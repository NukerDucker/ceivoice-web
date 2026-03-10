// Submit a new ticket
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreateTicketModal } from '@/components/tickets/ReplyBox';

export default function NewTicketPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
      setUserId(data.user?.id);
    });
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Submit a Ticket</h1>
      <CreateTicketModal defaultEmail={email} defaultUserId={userId} />
    </div>
  );
}
