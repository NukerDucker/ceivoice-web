'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Request';
import { MOCK_USER_TICKETS, UserTicket } from '@/lib/constants';
import { Search, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'submitted' | 'in-progress' | 'resolved' | 'critical';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  submitted: {
    label: 'Submitted',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Clock size={12} />,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: <AlertCircle size={12} />,
  },
};

const ALL_STATUSES: Status[] = ['submitted', 'in-progress', 'resolved', 'critical'];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Assignee Avatar ──────────────────────────────────────────────────────────

function Avatar({ name, fallback, avatar }: { name: string; fallback: string; avatar?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-white text-xs font-semibold">{fallback}</span>
        )}
      </div>
      <span className="text-sm text-gray-600 truncate max-w-[120px]">{name}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all');

  const filtered = useMemo(() => {
    return MOCK_USER_TICKETS.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        (t.category ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = activeStatus === 'all' || t.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [search, activeStatus]);

  const countByStatus = useMemo(() => {
    return ALL_STATUSES.reduce((acc, s) => {
      acc[s] = MOCK_USER_TICKETS.filter((t) => t.status === s).length;
      return acc;
    }, {} as Record<Status, number>);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Summary Pills */}
        <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveStatus('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeStatus === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            All ({MOCK_USER_TICKETS.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = activeStatus === s;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive
                    ? `${cfg.bg} ${cfg.color} border-current`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cfg.label} ({countByStatus[s]})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, ID or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pt-4 pb-6 flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Request ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">
                    Assignee
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ticket) => (
                    <tr
                      key={ticket.ticketId}
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-gray-400">
                        {ticket.ticketId}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800 max-w-xs truncate">
                        {ticket.title}
                      </td>
                      <td className="px-5 py-4">
                        {ticket.category ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {ticket.category}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {ticket.date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-5 py-4">
                        <Avatar
                          name={ticket.assignee.name}
                          fallback={ticket.assignee.fallback}
                          avatar={ticket.assignee.avatar}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <ChevronRight
                          size={16}
                          className="text-gray-300 group-hover:text-orange-400 transition-colors"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 px-1">
              Showing {filtered.length} of {MOCK_USER_TICKETS.length} requests
            </p>
          )}
        </div>
      </div>
    </div>
  );
}