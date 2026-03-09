'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Check, ChevronDown, X,
  Clock, AlertTriangle, RefreshCw, MessageSquare,
  Eye, Users, BarChart2,
  History, Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/TicketTB';
import { TicketDetailModal } from '../dashboard/_components/ticket-detail-modal';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { PRIORITY_STYLES as PRIORITY_STYLE } from '@/lib/config';
import { getCatStyle } from '@/lib/utils';
import type {
  AssigneeTicket,
  AssigneeResolvedTicket as ResolvedTicket,
  TicketStatus,
  DashboardAssignee,
} from '@/types';
import type { ApiUser, ApiTicket as ApiTicketRaw } from '@/types/api';

function apiUserName(u?: ApiUser | null): string {
  return u?.full_name ?? u?.user_name ?? u?.email ?? 'Unknown';
}

function toAssignee(u?: ApiUser | null): DashboardAssignee {
  const n = apiUserName(u);
  return { name: n, fallback: n.charAt(0), role: u?.role ?? '', department: '' };
}

function toTicketStatus(s?: string | null): TicketStatus {
  return ((s ?? 'new').toLowerCase()) as TicketStatus;
}

function toPriority(p: string): 'critical' | 'high' | 'medium' | 'low' {
  return p.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
}

function mapApiTicket(t: ApiTicketRaw): AssigneeTicket {
  return {
    ticketId:  String(t.ticket_id),
    title:     t.title,
    category:  t.category?.name ?? 'General',
    status:    toTicketStatus(t.status?.name),
    priority:  toPriority(t.priority),
    date:      new Date(t.created_at),
    deadline:  new Date(t.deadline ?? Date.now() + 86_400_000),
    assignee:  toAssignee(t.assignee),
    creator:   apiUserName(t.creator),
    followers: [],
    history:   [],
    comments:  [],
  };
}

function mapResolvedTicket(t: ApiTicketRaw): ResolvedTicket {
  const sName = t.status?.name?.toLowerCase() ?? 'solved';
  return {
    ticketId:     String(t.ticket_id),
    title:        t.title,
    category:     t.category?.name ?? 'General',
    status:       (sName === 'failed' ? 'failed' : 'solved') as 'solved' | 'failed',
    priority:     toPriority(t.priority),
    date:         new Date(t.created_at),
    resolvedDate: new Date(t.resolved_at ?? t.updated_at),
  };
}

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; borderColor: string; badgeBorder: string; badgeText: string; bg: string }
> = {
  draft:    { label: 'DRAFT',    borderColor: 'border-l-gray-400',   badgeBorder: 'border-gray-400',   badgeText: 'text-gray-500',   bg: 'bg-gray-50'   },
  new:      { label: 'NEW',      borderColor: 'border-l-blue-400',   badgeBorder: 'border-blue-500',   badgeText: 'text-blue-600',   bg: 'bg-blue-50'   },
  assigned: { label: 'ASSIGNED', borderColor: 'border-l-indigo-400', badgeBorder: 'border-indigo-500', badgeText: 'text-indigo-600', bg: 'bg-indigo-50' },
  solving:  { label: 'SOLVING',  borderColor: 'border-l-yellow-400', badgeBorder: 'border-yellow-500', badgeText: 'text-yellow-600', bg: 'bg-yellow-50' },
  solved:   { label: 'SOLVED',   borderColor: 'border-l-green-500',  badgeBorder: 'border-green-600',  badgeText: 'text-green-600',  bg: 'bg-green-50'  },
  failed:   { label: 'FAILED',   borderColor: 'border-l-red-500',    badgeBorder: 'border-red-500',    badgeText: 'text-red-500',    bg: 'bg-red-50'    },
  renew:    { label: 'RENEW',    borderColor: 'border-l-orange-400', badgeBorder: 'border-orange-500', badgeText: 'text-orange-600', bg: 'bg-orange-50' },
};

const STATUS_TABS: { label: string; value: TicketStatus | 'all' | 'resolved' }[] = [
  { label: 'All Active',  value: 'all'      },
  { label: 'New',         value: 'new'      },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'Solving',     value: 'solving'  },
  { label: 'Renew',       value: 'renew'    },
  { label: 'Resolved',    value: 'resolved' },
];

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function deadlineLabel(deadline: Date): { text: string; urgent: boolean } {
  const diff = deadline.getTime() - Date.now();
  const h = diff / 3_600_000;
  if (h < 0)  return { text: 'Overdue',              urgent: true  };
  if (h < 6)  return { text: `${Math.round(h)}h left`, urgent: true  };
  if (h < 24) return { text: `${Math.round(h)}h left`, urgent: false };
  return { text: `${Math.floor(h / 24)}d left`,       urgent: false };
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={`flex items-center rounded-full border ${cfg.badgeBorder} overflow-hidden select-none`}>
      <span className={`text-[11px] font-bold px-3 py-1.5 ${cfg.badgeText} whitespace-nowrap`}>
        {cfg.label}
      </span>
    </div>
  );
}

function TicketRow({
  ticket,
  onOpen,
  onOpenResolved,
}: {
  ticket:           AssigneeTicket | ResolvedTicket;
  onOpen?:          (t: AssigneeTicket) => void;
  onOpenResolved?:  (t: ResolvedTicket) => void;
}) {
  const cfg      = STATUS_CONFIG[ticket.status];
  const isActive = 'deadline' in ticket;
  const active   = isActive ? (ticket as AssigneeTicket)  : null;
  const resolved = !isActive ? (ticket as ResolvedTicket) : null;
  const dl       = active ? deadlineLabel(active.deadline) : null;
  const formattedDate = ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={`border-l-4 ${cfg.borderColor} bg-white rounded-xl shadow-sm border border-gray-100 ${
      (active && onOpen) || (resolved && onOpenResolved)
        ? 'hover:bg-gray-50/40 transition-colors duration-150'
        : ''
    }`}>
      <div className={`flex items-center gap-3 sm:gap-6 px-3 sm:px-6 ${isActive ? 'py-4' : 'py-3'}`}>

        <div className="flex flex-col gap-0.5 w-[80px] sm:w-[120px] shrink-0">
          <span className="text-xs font-semibold text-gray-700">#{ticket.ticketId}</span>
          {active && (
            <span className="text-xs text-gray-500">
              {ticket.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
          <span className="text-xs text-gray-400">{formattedDate}</span>
          {dl && (
            <span className={`text-[10px] font-semibold mt-1 flex items-center gap-0.5 ${dl.urgent ? 'text-red-500' : 'text-gray-400'}`}>
              {dl.urgent && <AlertTriangle size={9} />}
              <Clock size={9} />
              {dl.text}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {active && onOpen ? (
            <>
              <button
                onClick={() => onOpen(active)}
                className="text-sm font-semibold text-gray-800 mb-2 sm:mb-3 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all"
              >
                {ticket.title}
              </button>

              <div className="hidden sm:flex items-start">
                {([
                  { label: 'Category', value: ticket.category,                                                                       width: 'w-[160px]' },
                  { label: 'Priority', value: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),                    width: 'w-[100px]' },
                  { label: 'Assignee', value: active.assignee.name,                                                                  width: 'w-[200px]' },
                  { label: 'Comments', value: `${active.comments.length} comment${active.comments.length !== 1 ? 's' : ''}`,         width: 'w-[120px]' },
                ] as { label: string; value: string; width: string }[]).map(({ label, value, width }) => (
                  <div key={label} className={`flex flex-col gap-0.5 ${width} shrink-0`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-gray-600 font-medium truncate">{value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:hidden">
                {([
                  { label: 'Category', value: ticket.category },
                  { label: 'Priority', value: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) },
                  { label: 'Assignee', value: active.assignee.name },
                  { label: 'Comments', value: `${active.comments.length} comment${active.comments.length !== 1 ? 's' : ''}` },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-gray-600 font-medium truncate">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : resolved && onOpenResolved ? (
            <button
              onClick={() => onOpenResolved(resolved)}
              className="text-sm font-semibold text-gray-700 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all w-full"
            >
              {ticket.title}
            </button>
          ) : (
            <span className="text-sm font-semibold text-gray-700">{ticket.title}</span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full" style={getCatStyle(ticket.category)}>
            {ticket.category}
          </span>
          <StatusBadge status={ticket.status} />

          {resolved && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-400">
                {resolved.resolvedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
              {onOpenResolved && (
                <button
                  onClick={() => onOpenResolved(resolved)}
                  className="text-gray-300 hover:text-gray-700 transition-colors"
                  title="View ticket"
                >
                  <Eye size={13} />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

interface PerfData {
  total_solved: number;
  total_failed: number;
  success_rate: string;
  avg_resolution_time_hours: number | null;
  resolved_by_category: { category: string; count: number }[];
}

interface WorkloadData {
  total_active_tickets: number;
  overdue_count: number;
  upcoming_deadlines_count: number;
}

function PerformanceDashboard({ onClose, userName }: { onClose: () => void; userName: string }) {
  const [perf,     setPerf]     = useState<PerfData | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ performance: PerfData }>('/reporting/assignee/performance?period=last_30_days'),
      apiFetch<{ workload: WorkloadData }>('/reporting/assignee/workload'),
    ])
      .then(([perfRes, workloadRes]) => {
        setPerf(perfRes.performance);
        setWorkload(workloadRes.workload);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = perf && workload ? [
    {
      label: 'Active Tickets',
      value: workload.total_active_tickets,
      sub: 'Currently assigned',
      color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100',
    },
    {
      label: 'Solved (30d)',
      value: perf.total_solved,
      sub: 'Last 30 days',
      color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100',
    },
    {
      label: 'Failed (30d)',
      value: perf.total_failed,
      sub: 'Last 30 days',
      color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100',
    },
    {
      label: 'Success Rate',
      value: perf.success_rate === 'N/A' ? 'N/A' : perf.success_rate,
      sub: 'Solved / total closed (30d)',
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
    },
    {
      label: 'Avg Resolution',
      value: perf.avg_resolution_time_hours === null ? 'N/A' : `${perf.avg_resolution_time_hours}h`,
      sub: 'Hours per closed ticket',
      color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
    },
    {
      label: 'Overdue',
      value: workload.overdue_count,
      sub: 'Past deadline',
      color: workload.overdue_count > 0 ? 'text-red-600' : 'text-gray-600',
      bg: workload.overdue_count > 0 ? 'bg-red-50' : 'bg-gray-50',
      border: workload.overdue_count > 0 ? 'border-red-100' : 'border-gray-100',
    },
  ] : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-40 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8 w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <BarChart2 size={17} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">My Performance</h2>
              <p className="text-xs text-gray-400">{userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['s1','s2','s3','s4','s5','s6'].map((k) => (
              <div key={k} className="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse h-20" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Failed to load performance data: {error}
          </div>
        )}

        {!loading && !error && perf && workload && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs font-semibold text-gray-700">{s.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Upcoming Deadlines (7 days)</p>
              <p className="text-lg font-bold text-gray-900">{workload.upcoming_deadlines_count} tickets</p>
            </div>

            {perf.resolved_by_category.length > 0 && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolved by Category (30d)</p>
                <div className="flex flex-wrap gap-2">
                  {perf.resolved_by_category.map((c) => (
                    <span key={c.category} className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 font-medium">
                      {c.category} <span className="font-bold text-gray-900">{c.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function AssigneeTicketsPage() {
  const [activeTab,       setActiveTab]       = useState<TicketStatus | 'all' | 'resolved'>('all');
  const [activeTickets,   setActiveTickets]   = useState<AssigneeTicket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<ResolvedTicket[]>([]);
  const [ticketsLoading,  setTicketsLoading]  = useState(true);
  const [openTicketId,    setOpenTicketId]    = useState<number | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('Assignee');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserName(
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        'Assignee',
      );
    });
  }, []);

  const fetchTickets = useCallback(() => {
    setTicketsLoading(true);
    Promise.all([
      apiFetch<ApiTicketRaw[]>('/tickets/assigned'),
      apiFetch<ApiTicketRaw[]>('/tickets/assigned?resolved=true'),
    ])
      .then(([active, resolved]) => {
        setActiveTickets(active.map(mapApiTicket));
        setResolvedTickets(resolved.map(mapResolvedTicket));
      })
      .catch((err) => console.error('fetch tickets:', err))
      .finally(() => setTicketsLoading(false));
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleOpenTicket         = useCallback((t: AssigneeTicket)  => setOpenTicketId(Number(t.ticketId)),  []);
  const handleOpenResolvedTicket = useCallback((t: ResolvedTicket)  => setOpenTicketId(Number(t.ticketId)),  []);
  const handleModalClose         = useCallback(() => setOpenTicketId(null), []);
  const handleModalUpdate        = useCallback(() => fetchTickets(),         [fetchTickets]);

  const filtered = useMemo(() => {
    if (activeTab === 'resolved') return [];
    return activeTickets.filter((t) => activeTab === 'all' || t.status === activeTab);
  }, [activeTab, activeTickets]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all:      activeTickets.length,
      resolved: resolvedTickets.length,
    };
    activeTickets.forEach((t) => { map[t.status] = (map[t.status] ?? 0) + 1; });
    return map;
  }, [activeTickets, resolvedTickets]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentUserName}</p>
              <p className="text-xs text-gray-400">Assignee</p>
            </div>
          </div>
          <button
            onClick={() => setShowPerformance(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">My Performance</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>

        <div className="flex items-center gap-1 px-4 sm:px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const count    = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Loading tickets…</span>
            </div>
          ) : activeTab === 'resolved' ? (
            <div className="flex flex-col gap-2">
              {resolvedTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Check size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No resolved tickets yet</p>
                </div>
              ) : (
                resolvedTickets.map((t) => (
                  <TicketRow
                    key={t.ticketId}
                    ticket={t}
                    onOpenResolved={handleOpenResolvedTicket}
                  />
                ))
              )}
            </div>
          ) : filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filtered.map((ticket) => (
                <TicketRow key={ticket.ticketId} ticket={ticket} onOpen={handleOpenTicket} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No tickets found</p>
              <p className="text-xs mt-1 opacity-60">Try adjusting your filter</p>
            </div>
          )}
        </div>
      </div>

      {openTicketId !== null && (
        <TicketDetailModal
          ticketId={openTicketId}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}

      {showPerformance && (
        <PerformanceDashboard onClose={() => setShowPerformance(false)} userName={currentUserName} />
      )}
    </div>
  );
}