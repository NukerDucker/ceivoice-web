'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Request';
import type { UserTicket } from '@/types';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Search, ChevronRight, CheckCircle2, Loader2, PlusCircle, Sparkles, Bell, UserCheck, XCircle, RefreshCw } from 'lucide-react';
import { CreateTicketModal } from '@/components/tickets/ReplyBox';
import { TicketDetailModal } from './_components/ticket-detail';
import type { ApiUser, ApiTicket as ApiTicketRaw } from '@/types/api';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function userName(u: ApiUser | null): string {
  if (!u) return 'Unassigned';
  return u.full_name ?? u.user_name ?? u.email ?? 'Unknown';
}
function userFallback(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
}
function toStatus(raw: string | undefined): UserTicket['status'] {
  const map: Record<string, UserTicket['status']> = {
    Draft: 'draft', New: 'new', Assigned: 'assigned',
    Solving: 'solving', Solved: 'solved', Failed: 'failed', Renew: 'renew',
  };
  return map[raw ?? ''] ?? 'new';
}

function mapApiTicket(t: ApiTicketRaw): UserTicket {
  const assigneeName = userName(t.assignee ?? null);
  const creatorName  = userName(t.creator  ?? null);
  return {
    ticketId:    String(t.ticket_id),
    title:       t.title ?? '(No title)',
    category:    t.category?.name ?? null,
    date:        new Date(t.created_at),
    status:      toStatus(t.status?.name),
    description: t.summary ?? undefined,
    assignee:    { name: assigneeName, fallback: userFallback(assigneeName) },
    creator:     { name: creatorName,  fallback: userFallback(creatorName), role: 'Requester' },
    followers:   [],
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'draft' | 'new' | 'assigned' | 'solving' | 'solved' | 'failed' | 'renew';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    icon: <Sparkles size={12} />,
  },
  new: {
    label: 'New',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Bell size={12} />,
  },
  assigned: {
    label: 'Assigned',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
    icon: <UserCheck size={12} />,
  },
  solving: {
    label: 'Solving',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  solved: {
    label: 'Solved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle size={12} />,
  },
  renew: {
    label: 'Renewed',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    icon: <RefreshCw size={12} />,
  },
};

const ALL_STATUSES: Status[] = ['draft', 'new', 'assigned', 'solving', 'solved', 'failed', 'renew'];

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
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
        {avatar ? (
          <Image src={avatar} alt={name} width={28} height={28} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-white text-xs font-semibold">{fallback}</span>
        )}
      </div>
      <span className="text-sm text-gray-600 truncate max-w-30">{name}</span>
    </div>
  );
}

// ─── Mobile Ticket Card ───────────────────────────────────────────────────────

function TicketCard({ ticket, onClick }: { ticket: UserTicket; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 cursor-pointer active:bg-orange-50/30 transition-colors"
    >
      {/* Top row: ID + Status */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">#{ticket.ticketId}</span>
        <StatusBadge status={ticket.status as Status} />
      </div>

      {/* Title */}
      <p className="font-medium text-gray-800 text-sm leading-snug">{ticket.title}</p>

      {/* Bottom row: category, date, assignee */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {ticket.category && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {ticket.category}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {ticket.date.toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
        <Avatar
          name={ticket.assignee.name}
          fallback={ticket.assignee.fallback}
          avatar={ticket.assignee.avatar}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const [search, setSearch]                 = useState('');
  const [activeStatus, setActiveStatus]     = useState<Status | 'all'>('all');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [tickets, setTickets]         = useState<UserTicket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [userEmail, setUserEmail]     = useState('');
  const [userId, setUserId]           = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
      setUserId(data.user?.id);
    });
  }, []);

  useEffect(() => {
    apiFetch<ApiTicketRaw[]>('/tickets/mine')
      .then((data) => setTickets(data.map(mapApiTicket)))
      .catch((err) => {
        console.error('fetch /tickets/mine:', err);
        setFetchError('Failed to load tickets.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        (t.category ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = activeStatus === 'all' || t.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [search, activeStatus, tickets]);

  const countByStatus = useMemo(() => {
    return ALL_STATUSES.reduce((acc, s) => {
      acc[s] = tickets.filter((t) => t.status === s).length;
      return acc;
    }, {} as Record<Status, number>);
  }, [tickets]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          rightContent={
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle size={16} />
              {/* Hide label on mobile, show on desktop */}
              <span className="hidden sm:inline">Create New Request</span>
              <span className="sm:hidden">New</span>
            </button>
          }
        />

        {/* Summary Pills — horizontal scroll on mobile */}
        <div className="px-4 md:px-6 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveStatus('all')}
            className={`px-3 md:px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap shrink-0 ${
              activeStatus === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            All ({tickets.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = activeStatus === s;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap shrink-0 ${
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
        <div className="px-4 md:px-6 pt-3">
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

        {/* ── MOBILE: Card list ── DESKTOP: Table ── */}
        <div className="px-4 md:px-6 pt-4 pb-6 flex-1 overflow-auto">

          {/* MOBILE CARDS — shown below md */}
          <div className="flex flex-col gap-3 md:hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                Loading tickets…
              </div>
            ) : fetchError ? (
              <div className="py-16 text-center text-red-400 text-sm">{fetchError}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No requests found.</div>
            ) : (
              filtered.map((ticket) => (
                <TicketCard
                  key={ticket.ticketId}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))
            )}
          </div>

          {/* DESKTOP TABLE — hidden below md */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {/* ↓ Changed from "Request ID" to "ID" */}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                    ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                      Loading tickets…
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-red-400 text-sm">
                      {fetchError}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ticket) => (
                    <tr
                      key={ticket.ticketId}
                      onClick={() => setSelectedTicket(ticket)}
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-gray-400 truncate">
                        {ticket.ticketId}
                      </td>
                      {/* ↓ Added overflow-hidden so truncate works inside table-fixed */}
                      <td className="px-5 py-4 font-medium text-gray-800 truncate overflow-hidden">
                        {ticket.title}
                      </td>
                      {/* ↓ Category badge now truncates long text */}
                      <td className="px-5 py-4 overflow-hidden">
                        {ticket.category ? (
                          <span className="block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs truncate">
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
                        <StatusBadge status={ticket.status as Status} />
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
              Showing {filtered.length} of {tickets.length} requests
            </p>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-end bg-black/20 pt-4 px-4 pb-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="relative w-full max-w-2xl bg-white flex flex-col shadow-2xl rounded-2xl overflow-hidden animate-popup" style={{ height: 'calc(100% - 24px)' }}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg"
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex-1 flex flex-col min-h-0 overflow-auto">
              <CreateTicketModal defaultEmail={userEmail} defaultUserId={userId} />
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      <style>{`
        @keyframes popup {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-popup {
          animation: popup 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}