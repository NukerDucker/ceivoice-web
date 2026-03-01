'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Merge, X, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/DraftTB';
import { apiFetch } from '@/lib/api-client';

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiDraft {
  ticket_id: number;
  title: string | null;
  summary: string | null;
  created_at: string;
  status: { name: string } | null;
  category: { category_id: number; name: string } | null;
  ticket_requests: Array<{
    request: {
      email: string;
      message: string | null;
      tracking_id: string;
    } | null;
  }>;
}

// ─── Category badge color map ─────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Network:        { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200'   },
  Security:       { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'    },
  Database:       { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  Email:          { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200'  },
  Performance:    { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  Authentication: { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-200'   },
  Storage:        { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200'  },
  Mobile:         { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200'   },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function timeAgoFull(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function ConfidencePill({ value }: { value: number }) {
  const color =
    value >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
    value >= 75 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-red-50   text-red-600   border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      <Bot size={10} />
      {value}%
    </span>
  );
}

// ─── Draft Row ────────────────────────────────────────────────────────────────

function DraftRow({
  ticket,
  checked,
  onCheck,
}: {
  ticket: ApiDraft;
  checked: boolean;
  onCheck: (id: number, val: boolean) => void;
}) {
  const router   = useRouter();
  const request  = ticket.ticket_requests[0]?.request ?? null;
  const catName  = ticket.category?.name ?? 'General';
  const catStyle = getCategoryStyle(catName);

  const handleReview = () => {
    router.push(`/admin/review-ticket?id=${ticket.ticket_id}`);
  };

  return (
    <div className="border-l-4 border-l-violet-400 bg-white hover:bg-gray-50/40 transition-colors duration-150 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-5 px-6 py-4">

        {/* Checkbox + ID + time */}
        <div className="flex flex-col gap-0.5 w-[110px] shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(ticket.ticket_id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900 mb-1"
          />
          <span className="text-xs font-semibold text-gray-700">#{ticket.ticket_id}</span>
          <span className="text-xs text-gray-500">
            {new Date(ticket.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide flex items-center gap-1">
              <Bot size={10} /> AI Draft
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-[10px] text-gray-400">{timeAgoFull(ticket.created_at)}</span>
          </div>

          <button
            onClick={handleReview}
            className="text-sm font-semibold text-gray-800 mb-3 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all"
          >
            {ticket.title ?? '(Untitled)'}
          </button>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Original Email</span>
              <span className="text-xs text-gray-600 font-medium truncate">
                {request?.email ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Submitted</span>
              <span className="text-xs text-gray-600 font-medium">{timeAgo(ticket.created_at)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">AI Category</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {catName}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">AI Confidence</span>
              <ConfidencePill value={80} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
          >
            Review
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Merge Popup ──────────────────────────────────────────────────────────────

function MergePopup({
  selectedIds,
  onClear,
  onMerge,
}: {
  selectedIds: number[];
  onClear: () => void;
  onMerge: () => void;
}) {
  if (selectedIds.length < 2) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="bg-gray-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {selectedIds.length}
          </span>
          <span className="text-sm font-medium text-gray-700">drafts selected</span>
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
            Merge into Draft
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

export default function AdminDraftQueuePage() {
  const router = useRouter();
  const [drafts,           setDrafts]           = useState<ApiDraft[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set());
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [merging,          setMerging]          = useState(false);
  const [mergeError,       setMergeError]       = useState<string | null>(null);
  const [search,           setSearch]           = useState('');

  const loadDrafts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<ApiDraft[]>('/admin/drafts')
      .then((data) => { if (!cancelled) { setDrafts(data); setLoading(false); } })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadDrafts(), [loadDrafts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return drafts;
    const q = search.toLowerCase();
    return drafts.filter(
      (t) =>
        (t.title ?? '').toLowerCase().includes(q) ||
        (t.category?.name ?? '').toLowerCase().includes(q) ||
        (t.ticket_requests[0]?.request?.email ?? '').toLowerCase().includes(q)
    );
  }, [drafts, search]);

  const handleCheck = (id: number, val: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.ticket_id)));
    }
  };

  const handleMerge = () => { setMergeError(null); setShowMergeConfirm(true); };
  const handleClear = () => { setSelectedIds(new Set()); setShowMergeConfirm(false); setMergeError(null); };

  const handleConfirmMerge = async () => {
    const ids = Array.from(selectedIds).sort((a, b) => a - b);
    const [parentId, ...childIds] = ids;
    setMerging(true);
    setMergeError(null);
    try {
      await apiFetch(`/admin/${parentId}/merge`, {
        method: 'POST',
        body: JSON.stringify({ child_ticket_ids: childIds }),
      });
      setShowMergeConfirm(false);
      setSelectedIds(new Set());
      loadDrafts();
      router.push(`/admin/review-ticket?id=${parentId}`);
    } catch (err: unknown) {
      setMergeError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const allChecked = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-xs text-gray-500 font-medium">Select all</span>
            </label>

            <div className="w-px h-4 bg-gray-200" />

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-700">
                {loading ? 'Loading…' : `${drafts.length} draft${drafts.length !== 1 ? 's' : ''} waiting`}
              </span>
              {!loading && (
                <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">
                  {drafts.length}
                </span>
              )}
            </div>
          </div>

          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drafts…"
              className="w-full pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 outline-none focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Draft list */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium">Loading drafts…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-400">
              <p className="text-sm font-medium">Failed to load drafts</p>
              <p className="text-xs mt-1 opacity-60">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.length > 0 ? (
                filtered.map((ticket) => (
                  <DraftRow
                    key={ticket.ticket_id}
                    ticket={ticket}
                    checked={selectedIds.has(ticket.ticket_id)}
                    onCheck={handleCheck}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Search size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No drafts found</p>
                  <p className="text-xs mt-1 opacity-60">
                    {drafts.length === 0 ? 'No drafts pending review.' : 'Try adjusting your search.'}
                  </p>
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
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Merge {selectedIds.size} Drafts
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              This will combine the selected drafts into a single draft ticket for review. All original senders will be added as followers.
            </p>
            <div className="flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto">
              {Array.from(selectedIds).map((id) => {
                const ticket = drafts.find((t) => t.ticket_id === id);
                const req    = ticket?.ticket_requests[0]?.request;
                return (
                  <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-mono text-gray-400">#{id}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{ticket?.title}</p>
                      {req?.email && (
                        <p className="text-[10px] text-gray-400 truncate">from {req.email}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {mergeError && (
              <p className="text-xs text-red-600 mb-3">{mergeError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmMerge}
                disabled={merging}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {merging ? 'Merging…' : 'Confirm Merge'}
              </button>
              <button
                onClick={() => setShowMergeConfirm(false)}
                disabled={merging}
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
