'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Check, Pencil, ChevronDown, User, Merge, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/TicketTB';
import { apiFetch } from '@/lib/api-client';

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiUser {
  user_id: string;
  full_name: string | null;
  user_name: string | null;
  email: string;
}

interface ApiTicket {
  ticket_id: number;
  title: string | null;
  created_at: string;
  status_id: number;
  status: { name: string } | null;
  category: { name: string } | null;
  assignee: ApiUser | null;
}

type TicketStatus = 'draft' | 'new' | 'assigned' | 'solving' | 'solved' | 'failed' | 'renew';

// Map backend status names (Title-case) → frontend keys (lowercase)
const STATUS_NAME_MAP: Record<string, TicketStatus> = {
  Draft: 'draft', New: 'new', Assigned: 'assigned',
  Solving: 'solving', Solved: 'solved', Failed: 'failed', Renew: 'renew',
};

// Map frontend tab value → backend status name (Title-case)
const TAB_TO_API: Record<string, string> = {
  draft: 'Draft', new: 'New', assigned: 'Assigned',
  solving: 'Solving', solved: 'Solved', failed: 'Failed', renew: 'Renew',
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; borderColor: string; badgeBorder: string; badgeText: string }> = {
  draft:    { label: 'DRAFT',    borderColor: 'border-l-gray-400',   badgeBorder: 'border-gray-400',   badgeText: 'text-gray-500'   },
  new:      { label: 'NEW',      borderColor: 'border-l-blue-400',   badgeBorder: 'border-blue-500',   badgeText: 'text-blue-600'   },
  assigned: { label: 'ASSIGNED', borderColor: 'border-l-indigo-400', badgeBorder: 'border-indigo-500', badgeText: 'text-indigo-600' },
  solving:  { label: 'SOLVING',  borderColor: 'border-l-yellow-400', badgeBorder: 'border-yellow-500', badgeText: 'text-yellow-600' },
  solved:   { label: 'SOLVED',   borderColor: 'border-l-green-500',  badgeBorder: 'border-green-600',  badgeText: 'text-green-600'  },
  failed:   { label: 'FAILED',   borderColor: 'border-l-red-500',    badgeBorder: 'border-red-500',    badgeText: 'text-red-500'    },
  renew:    { label: 'RENEW',    borderColor: 'border-l-orange-400', badgeBorder: 'border-orange-500', badgeText: 'text-orange-600' },
};

const ALL_STATUSES: TicketStatus[] = ['draft', 'new', 'assigned', 'solving', 'solved', 'failed', 'renew'];

const STATUS_TABS: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'Draft',    value: 'draft'    },
  { label: 'New',      value: 'new'      },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Solving',  value: 'solving'  },
  { label: 'Solved',   value: 'solved'   },
  { label: 'Failed',   value: 'failed'   },
  { label: 'Renew',    value: 'renew'    },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, onChange }: { status: TicketStatus; onChange: (s: TicketStatus) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="relative">
      <div className={`flex items-center rounded-full border ${cfg.badgeBorder} overflow-hidden select-none`}>
        <span className={`text-[11px] font-bold px-3 py-1.5 ${cfg.badgeText} whitespace-nowrap`}>
          {cfg.label}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`px-2 py-1.5 border-l ${cfg.badgeBorder} ${cfg.badgeText} hover:opacity-70 transition-opacity`}
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[140px]">
            {ALL_STATUSES.map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-[11px] font-bold ${c.badgeText} hover:bg-gray-50 transition-colors ${s === status ? 'bg-gray-50' : ''}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({
  ticket,
  checked,
  onCheck,
  onStatusChange,
}: {
  ticket: ApiTicket;
  checked: boolean;
  onCheck: (id: number, val: boolean) => void;
  onStatusChange: (id: number, status: TicketStatus) => void;
}) {
  const router     = useRouter();
  const rawStatus  = ticket.status?.name ?? 'Draft';
  const initStatus = STATUS_NAME_MAP[rawStatus] ?? 'draft';
  const [status, setStatus] = useState<TicketStatus>(initStatus);
  const cfg     = STATUS_CONFIG[status];
  const created = new Date(ticket.created_at);

  const handleReview = () => router.push(`/admin/review-ticket?id=${ticket.ticket_id}`);

  const handleStatusChange = (s: TicketStatus) => {
    setStatus(s);
    onStatusChange(ticket.ticket_id, s);
  };

  return (
    <div className={`border-l-4 ${cfg.borderColor} bg-white hover:bg-gray-50/40 transition-colors duration-150 rounded-xl shadow-sm border border-gray-100`}>
      <div className="flex items-center gap-6 px-6 py-4">

        {/* ID + checkbox + time */}
        <div className="flex flex-col gap-0.5 w-[120px] shrink-0">
          <span className="text-xs font-semibold text-gray-700">#{ticket.ticket_id}</span>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(ticket.ticket_id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900 my-1"
          />
          <span className="text-xs text-gray-500">
            {created.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-xs text-gray-400">
            {created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Title + details */}
        <div className="flex-1 min-w-0">
          <button
            onClick={handleReview}
            className="text-sm font-semibold text-gray-800 mb-3 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all"
          >
            {ticket.title ?? '(Untitled)'}
          </button>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Category',  value: ticket.category?.name ?? '—' },
              { label: 'Priority',  value: 'N/A'                        },
              { label: 'Assignee',  value: ticket.assignee?.full_name ?? ticket.assignee?.user_name ?? 'Unassigned' },
              { label: 'Ticket-Id', value: `#${ticket.ticket_id}`       },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
                <span className="text-xs text-gray-600 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            <User size={13} className="text-gray-400" />
            Client note
          </button>
          <StatusBadge status={status} onChange={handleStatusChange} />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleStatusChange('solved')}
              className="text-gray-300 hover:text-gray-900 transition-colors"
              title="Mark as solved"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleReview}
              className="text-gray-300 hover:text-gray-900 transition-colors"
              title="Review ticket"
            >
              <Pencil size={13} />
            </button>
            <button className="text-gray-300 hover:text-gray-600 transition-colors">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Merge Popup ──────────────────────────────────────────────────────────────

function MergePopup({ selectedIds, onClear, onMerge }: { selectedIds: number[]; onClear: () => void; onMerge: () => void }) {
  if (selectedIds.length < 2) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="bg-gray-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {selectedIds.length}
          </span>
          <span className="text-sm font-medium text-gray-700">tickets selected</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          {selectedIds.slice(0, 3).map((id) => (
            <span key={id} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-mono">
              #{id}
            </span>
          ))}
          {selectedIds.length > 3 && (
            <span className="text-[11px] text-gray-400">+{selectedIds.length - 3} more</span>
          )}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <button
            onClick={onMerge}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Merge size={15} />
            Merge Tickets
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const [activeTab,        setActiveTab]        = useState<TicketStatus | 'all'>('all');
  const [tickets,          setTickets]          = useState<ApiTicket[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set());
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  const fetchTickets = useCallback(async (tab: TicketStatus | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const url = tab === 'all'
        ? '/api/admin/tickets'
        : `/api/tickets/status/${TAB_TO_API[tab]}`;
      const data = await apiFetch<ApiTicket[]>(url);
      setTickets(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(activeTab);
  }, [activeTab, fetchTickets]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: tickets.length };
    tickets.forEach((t) => {
      const s = STATUS_NAME_MAP[t.status?.name ?? ''] ?? 'draft';
      map[s] = (map[s] ?? 0) + 1;
    });
    return map;
  }, [tickets]);

  const handleTabChange = (tab: TicketStatus | 'all') => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const handleCheck = (id: number, val: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    try {
      await apiFetch(`/api/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: TAB_TO_API[status] }),
      });
      fetchTickets(activeTab);
    } catch {
      // Row's local state already updated; next fetch will correct it
    }
  };

  const handleMerge = () => setShowMergeConfirm(true);
  const handleClear = () => { setSelectedIds(new Set()); setShowMergeConfirm(false); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userRole="admin" userName="Admin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-gray-100 shrink-0">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const count    = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {loading ? '…' : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium">Loading tickets…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-400">
              <p className="text-sm font-medium">Failed to load tickets</p>
              <p className="text-xs mt-1 opacity-60">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.ticket_id}
                    ticket={ticket}
                    checked={selectedIds.has(ticket.ticket_id)}
                    onCheck={handleCheck}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Search size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No tickets found</p>
                  <p className="text-xs mt-1 opacity-60">No tickets in this category</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MergePopup
        selectedIds={Array.from(selectedIds)}
        onClear={handleClear}
        onMerge={handleMerge}
      />

      {/* Merge confirm modal */}
      {showMergeConfirm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setShowMergeConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-[440px]">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Merge {selectedIds.size} Tickets</h2>
            <p className="text-sm text-gray-400 mb-6">
              This will combine the selected tickets into one. The oldest ticket will be kept as the primary.
            </p>
            <div className="flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto">
              {Array.from(selectedIds).map((id) => {
                const t = tickets.find((tk) => tk.ticket_id === id);
                return (
                  <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-mono text-gray-400">#{id}</span>
                    <span className="text-sm text-gray-700 truncate">{t?.title ?? '(Untitled)'}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Confirm Merge
              </button>
              <button
                onClick={() => setShowMergeConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
