'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Badge } from "@/components/ui/badge";
import { TicketList } from "@/components/user/ticket-list";
import { Header } from "@/components/user/ticket-header";
import { getMe } from '@/services/auth';
import { getTickets, TicketResponse } from '@/services/tickets';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<'user' | 'admin' | 'assignee'>('user');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const router = useRouter();

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const ticketsData: TicketResponse[] = await getTickets();

      // Transform backend data to match frontend format
      const transformedTickets = ticketsData.map((ticket) => ({
        ticketId: ticket.id,
        title: ticket.title,
        category: ticket.category || null,
        date: new Date(ticket.createdAt),
        status: ticket.status.toLowerCase().replace('_', '-') as 'submitted' | 'in-progress' | 'resolved' | 'critical',
        assignee: ticket.assignee ? {
          name: ticket.assignee.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.assignee.name}`,
          fallback: ticket.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        } : undefined,
      }));

      setTickets(transformedTickets);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      // Set empty array if fetch fails
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setCurrentUser(userData);
        // Map backend role to frontend role type
        const mappedRole = userData.role.toLowerCase() as 'user' | 'admin' | 'assignee';
        setCurrentRole(mappedRole);

        // Fetch tickets after user is loaded
        await fetchTickets();
      } catch (err) {
        console.error("Failed to fetch user:", err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, fetchTickets]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
      </div>
    );
  }
  return (
    <div className="flex gap-0 h-screen bg-gray-50">
      <Sidebar
        userRole={currentRole}
        userName={currentUser?.name || "User"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentUser?.role === 'ADMIN' && (
          <div className="px-10 py-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5">
                {(['user', 'admin', 'assignee'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                      currentRole === role
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {role} View
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 font-mono">ADMIN MODE</div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          <div className="space-y-1">
            <Header />
            <div className="rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              </div>
              <div className="p-0">
                <TicketList data={tickets} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
