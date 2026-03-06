'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Merge, X, Bot, Sparkles, ChevronRight, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/DraftTB';
import { apiFetch } from '@/lib/api-client';
import type { ApiDraft } from '@/types/api';

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

// ─── Suggest Merge Types — matches actual db.service response ─────────────────

interface SuggestedMergeTicket {
  ticket_id: number;
  title: string;
  summary: string;
  status?: { name: string };
}

interface SuggestedMerge {
  id: number;
  suggested_parent_id: number;
  suggested_child_id: number;
  similarity_reason: string | null;
  created_at: string;
  suggested_parent: SuggestedMergeTicket;
  suggested_child: SuggestedMergeTicket;
}

interface MergeGroup {
  parentId: number;
  childIds: number[];
  parent: SuggestedMergeTicket;
  children: SuggestedMergeTicket[];
  reason: string | null;
}

// ─── Cluster suggestions by parent ticket ────────────────────────────────────
// FIX 3 & 4: Deduplicate children across groups and filter out parent/child conflicts

function clusterMerges(suggestions: SuggestedMerge[]): MergeGroup[] {
  const groupMap = new Map<number, MergeGroup>();
  const assignedChildren = new Set<number>(); // FIX 3: track claimed children

  for (const s of suggestions) {
    const parentId = s.suggested_parent_id;

    // FIX 3: skip if this child is already claimed by another group
    if (assignedChildren.has(s.suggested_child_id)) continue;

    const existing = groupMap.get(parentId);
    if (existing) {
      if (!existing.childIds.includes(s.suggested_child_id)) {
        existing.childIds.push(s.suggested_child_id);
        existing.children.push(s.suggested_child);
        assignedChildren.add(s.suggested_child_id);
      }
    } else {
      groupMap.set(parentId, {
        parentId,
        childIds: [s.suggested_child_id],
        parent: s.suggested_parent,
        children: [s.suggested_child],
        reason: s.similarity_reason,
      });
      assignedChildren.add(s.suggested_child_id);
    }
  }

  // FIX 4: remove groups where the parent ticket is also a child in another group
  const allChildIds = new Set(
    Array.from(groupMap.values()).flatMap((g) => g.childIds)
  );

  return Array.from(groupMap.values()).filter(
    (g) => !allChildIds.has(g.parentId)
  );
}

// ─── Merge Group Card ─────────────────────────────────────────────────────────

function MergeGroupCard({
  group,
  selected,
  onToggle,
}: {
  group: MergeGroup;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer rounded-xl border-2 transition-all duration-150 overflow-hidden
        ${selected
          ? 'border-violet-400 bg-violet-50/40 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
            ${selected ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
            {selected && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {1 + group.children.length} tickets to merge
          </span>
          {group.reason && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-200 max-w-[200px] truncate">
              <Bot size={9} />{group.reason}
            </span>
          )}
        </div>
        <Merge size={13} className="text-violet-400" />
      </div>

      {/* Ticket list */}
      <div className="px-4 py-3">
        {/* Parent */}
        <div className="flex items-start gap-2 mb-2">
          <span className="shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded uppercase tracking-wide">
            Parent
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {group.parent.title || '(Untitled)'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">#{group.parent.ticket_id}</p>
          </div>
        </div>

        {/* Children */}
        {group.children.map((child) => (
          <div key={child.ticket_id} className="flex items-start gap-2 ml-6 mt-2">
            <ChevronRight size={12} className="text-gray-300 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium leading-snug">
                {child.title || '(Untitled)'}
              </p>
              <p className="text-[11px] text-gray-400">#{child.ticket_id}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Followers note */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <Users size={11} className="text-gray-400 shrink-0" />
        <p className="text-[10px] text-gray-500">
          Requesters from merged tickets will become followers of #{group.parent.ticket_id}
        </p>
      </div>
    </div>
  );
}

// ─── Suggest Merge Modal ──────────────────────────────────────────────────────

function SuggestMergeModal({
  onClose,
  onMergeComplete,
}: {
  onClose: () => void;
  onMergeComplete: () => void;
}) {
  const [loading,        setLoading]    = useState(true);
  const [error,          setError]      = useState<string | null>(null);
  const [groups,         setGroups]     = useState<MergeGroup[]>([]);
  const [selectedGroups, setSelected]   = useState<Set<number>>(new Set());
  const [merging,        setMerging]    = useState(false);
  const [mergeError,     setMergeError] = useState<string | null>(null);
  const [done,           setDone]       = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ suggested_merges: SuggestedMerge[] }>('/admin/suggested-merges');
      const clustered = clusterMerges(data.suggested_merges ?? []);
      setGroups(clustered);
      setSelected(new Set(clustered.map((g) => g.parentId)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const toggleGroup = (parentId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId); else next.add(parentId);
      return next;
    });
  };

  const handleMergeAll = async () => {
    const toMerge = groups.filter((g) => selectedGroups.has(g.parentId));
    if (toMerge.length === 0) return;
    setMerging(true);
    setMergeError(null);
    try {
      for (const group of toMerge) {
        await apiFetch(`/admin/${group.parentId}/merge`, {
          method: 'POST',
          body: JSON.stringify({ child_ticket_ids: group.childIds }),
        });
      }
      setDone(true);
      onMergeComplete();
    } catch (err: unknown) {
      setMergeError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const selectedCount = groups.filter((g) => selectedGroups.has(g.parentId)).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
        w-[calc(100vw-2rem)] sm:w-[520px] max-h-[80vh]
        bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI Merge Suggestions</h2>
              <p className="text-[11px] text-gray-400">Similar tickets grouped by AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin mb-3 text-violet-400" />
              <p className="text-sm font-medium">Analysing tickets…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-400">
              <AlertCircle size={28} className="mb-3" />
              <p className="text-sm font-medium">Failed to load suggestions</p>
              <p className="text-[11px] mt-1 opacity-70">{error}</p>
              <button onClick={fetchSuggestions} className="mt-4 text-xs text-violet-600 hover:underline">
                Try again
              </button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-800">Merge complete!</p>
              <p className="text-xs text-gray-400 mt-1">Tickets merged and followers assigned.</p>
              <button
                onClick={onClose}
                className="mt-5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bot size={28} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No merge suggestions</p>
              <p className="text-[11px] mt-1 opacity-70">All drafts look unique to the AI.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-gray-400 mb-1">
                {groups.length} group{groups.length !== 1 ? 's' : ''} found · select which to merge
              </p>
              {groups.map((group) => (
                <MergeGroupCard
                  key={group.parentId}
                  group={group}
                  selected={selectedGroups.has(group.parentId)}
                  onToggle={() => toggleGroup(group.parentId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && !done && groups.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            {mergeError && <p className="text-xs text-red-500 mb-2">{mergeError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleMergeAll}
                disabled={merging || selectedCount === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800
                  disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {merging
                  ? <><Loader2 size={14} className="animate-spin" /> Merging…</>
                  : <><Merge size={14} /> Merge {selectedCount} group{selectedCount !== 1 ? 's' : ''}</>
                }
              </button>
              <button
                onClick={onClose}
                disabled={merging}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl
                  hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
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
  const request  = ticket.ticket_requests?.[0]?.request ?? null;
  const catName  = ticket.category?.name ?? 'General';
  const catStyle = getCategoryStyle(catName);

  const handleReview = () => router.push(`/admin/review-ticket?id=${ticket.ticket_id}`);

  return (
    <div className="border-l-4 border-l-violet-400 bg-white hover:bg-gray-50/40 transition-colors duration-150 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start sm:items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4">
        <div className="shrink-0 pt-0.5 sm:pt-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(ticket.ticket_id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-semibold text-gray-700">#{ticket.ticket_id}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {new Date(ticket.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' '}
              {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-gray-300 hidden sm:inline">·</span>
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide flex items-center gap-1">
              <Bot size={10} /> AI Draft
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">{timeAgoFull(ticket.created_at)}</span>
          </div>
          <button
            onClick={handleReview}
            className="text-sm font-semibold text-gray-800 mb-3 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all"
          >
            {ticket.title ?? '(Untitled)'}
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Original Email</span>
              <span className="text-xs text-gray-600 font-medium truncate">{request?.email ?? '—'}</span>
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
        <div className="shrink-0 self-start sm:self-auto">
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
    <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-white px-5 py-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="bg-gray-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium text-gray-700">drafts selected</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedIds.slice(0, 3).map((id) => (
              <span key={id} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-mono">#{id}</span>
            ))}
            {selectedIds.length > 3 && (
              <span className="text-[11px] text-gray-400">+{selectedIds.length - 3} more</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="hidden sm:block w-px h-5 bg-gray-200" />
          <button
            onClick={onMerge}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Merge size={15} />
            Merge into Draft
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
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
  const [showSuggestMerge, setShowSuggestMerge] = useState(false);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ApiDraft[]>(`/admin/drafts?t=${Date.now()}`);
      setDrafts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return drafts;
    const q = search.toLowerCase();
    return drafts.filter(
      (t) =>
        (t.title ?? '').toLowerCase().includes(q) ||
        (t.category?.name ?? '').toLowerCase().includes(q) ||
        (t.ticket_requests?.[0]?.request?.email ?? '').toLowerCase().includes(q)
    );
  }, [drafts, search]);

  const handleCheck = (id: number, val: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(id); else next.delete(id);
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

  const handleMerge    = () => { setMergeError(null); setShowMergeConfirm(true); };
  const handleClear    = () => { setSelectedIds(new Set()); setShowMergeConfirm(false); setMergeError(null); };

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
      await fetchDrafts();
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
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

          {/* Right: Suggest Merge + Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSuggestMerge(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200
                bg-violet-50 hover:bg-violet-100 text-violet-600 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Sparkles size={12} />
              Suggest Merge
            </button>

            <div className="relative flex-1 sm:w-64">
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
        </div>

        {/* FIX 1: Added min-h-0 so flex child can shrink and overflow-y-auto activates correctly.
            Also added pb-28 so content isn't hidden behind the MergePopup floating bar. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-28">
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

      {/* Suggest Merge Modal */}
      {showSuggestMerge && (
        <SuggestMergeModal
          onClose={() => setShowSuggestMerge(false)}
          onMergeComplete={fetchDrafts}
        />
      )}

      {/* Manual merge confirm modal */}
      {showMergeConfirm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setShowMergeConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 w-[calc(100vw-2rem)] sm:w-[440px]">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Merge {selectedIds.size} Drafts
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              This will combine the selected drafts into a single draft ticket for review. All original senders will be added as followers.
            </p>
            <div className="flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto">
              {Array.from(selectedIds).map((id) => {
                const ticket = drafts.find((t) => t.ticket_id === id);
                const req    = ticket?.ticket_requests?.[0]?.request;
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
            {mergeError && <p className="text-xs text-red-600 mb-3">{mergeError}</p>}
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