'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Badge } from "@/components/ui/badge"
import { TicketList } from "@/components/user/ticket-list"
import { mockTickets } from '@/lib/constants';
import { Header } from "@/components/user/ticket-header"

const SidebarDemo = () => {
  const [currentRole, setCurrentRole] = useState<'user' | 'admin' | 'assignee'>('user');

  return (
    <div className="flex gap-0 h-screen bg-gray-50">
      <Sidebar
        userRole={currentRole}
        userName="Palm Pollapat"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 py-10 bg-white border-b border-gray-200">
          <div className="flex gap-2.5">
            <button
              onClick={() => setCurrentRole('user')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              User View
            </button>
            <button
              onClick={() => setCurrentRole('admin')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'admin'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              Admin View
            </button>
            <button
              onClick={() => setCurrentRole('assignee')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'assignee'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              Assignee View
            </button>
          </div>
        </div>

        <div className="flex-1 px-10 py-10 bg-gray-50 overflow-auto">
          <div className="bg-white rounded-lg p-10 shadow-sm">
            <h3 className="text-orange-500  text-lg font-semibold">Ticket Status Badges</h3>
            <div className="flex gap-3 mt-4">
              <Badge variant="submitted">Submitted</Badge>
              <Badge variant="in-progress">In Progress</Badge>
              <Badge variant="resolved">Resolved</Badge>
              <Badge variant="critical">Critical</Badge>
            </div>
            <h3 className="text-orange-500  text-lg font-semibold mt-8">User Ticket Status</h3>
            <div className="mt-4">
              <TicketList data={mockTickets} />
            </div>
            <h3>User Header</h3>
            <div className='mt-4'>
              <Header/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarDemo;
