'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TicketList } from "@/components/admin/ticket-list"
import { mockTickets } from '@/lib/constants';
import { Header } from "@/components/tickets/TicketListHeader"

export default function Page() {
  const [currentRole, setCurrentRole] = useState<'user' | 'admin' | 'assignee'>('admin'); // Changed from 'user' to 'admin'

  return (
    <div className="flex gap-0 h-screen bg-gray-50">
      <Sidebar
        userRole={currentRole}
        userName="Palm Pollapat"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <Header/>
          </div>

          <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
            <TicketList data={mockTickets} />
          </div>
        </div>
      </div>
    </div>
  );
}