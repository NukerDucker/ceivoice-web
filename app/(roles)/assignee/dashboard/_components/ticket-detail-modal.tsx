"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, CheckCircle, XCircle, UserRound, Clock, ChevronDown, MessageSquare, History, Users } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiUser,
  ApiStatusHistory,
  ApiAssignmentHistory,
  ApiTicketDetail,
  ApiAssignee,
} from '@/types/api';

export interface TicketDetailModalProps {
  ticketId: number;
  onClose:  () => void;
  onUpdate: () => void;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  New:      { bg: '#e8f0fe', text: '#1a56db', border: '#93b4fb' },
  Assigned: { bg: '#e5edff', text: '#3730a3', border: '#a5b4fc' },
  Solving:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Solved:   { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Failed:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Renew:    { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  high:     { bg: '#fef3c2', text: '#92400e', border: '#fcd34d' },
  medium:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  low:      { bg: '#dcfce7', text: '#166534', border: '#86efac' },
};

const STATUS_OPTIONS = ['Assigned', 'Solving', 'Solved', 'Failed'] as const;

function userName(u: ApiUser | ApiAssignee | null | undefined): string {
  if (!u) return '—';
  return u.full_name ?? u.user_name ?? u.email;
}

function userInitial(u: ApiUser | ApiAssignee | null | undefined): string {
  return userName(u).charAt(0).toUpperCase();
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeUntil(date: string | null) {
  if (!date) return { label: 'No deadline', urgent: false };
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return { label: 'Overdue', urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 24) return { label: `${h}h ${m}m left`, urgent: h < 6 };
  return { label: `${Math.floor(h / 24)}d ${h % 24}h left`, urgent: false };
}

// ─── Resolution Modal ─────────────────────────────────────────────────────────

function ResolutionModal({
  targetStatus,
  onConfirm,
  onCancel,
}: {
  targetStatus: 'Solved' | 'Failed';
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState('');
  const isSolved = targetStatus === 'Solved';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-[480px]">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isSolved ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSolved
            ? <CheckCircle size={24} className="text-green-600" />
            : <XCircle    size={24} className="text-red-500"   />}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Mark as {isSolved ? 'Solved' : 'Failed'}
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          A resolution comment is required before closing this ticket.
        </p>

        <textarea
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isSolved
            ? 'Describe what was done to resolve the issue…'
            : 'Explain why the ticket could not be resolved…'}
          className="w-full h-32 text-sm text-gray-700 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-300"
        />
        {comment.trim().length === 0 && (
          <p className="text-[11px] text-red-400 mt-1.5">A comment is required to continue.</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            disabled={comment.trim().length === 0}
            onClick={() => onConfirm(comment.trim())}
            className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${
              isSolved
                ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-200'
                : 'bg-red-400 hover:bg-red-500 disabled:bg-red-200'
            } disabled:cursor-not-allowed`}
          >
            Confirm — {isSolved ? 'Solved' : 'Failed'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketDetailModal({ ticketId, onClose, onUpdate }: TicketDetailModalProps) {
  const [ticket,           setTicket]           = useState<ApiTicketDetail | null>(null);
  const [assigneeList,     setAssigneeList]     = useState<ApiAssignee[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setActiveTab]        = useState<'comments' | 'history'>('comments');

  const [updatingStatus,   setUpdatingStatus]   = useState(false);
  const [pendingStatus,    setPendingStatus]    = useState<'Solved' | 'Failed' | null>(null);

  const [commentText,      setCommentText]      = useState('');
  const [commentType,      setCommentType]      = useState<'internal' | 'public'>('internal');
  const [postingComment,   setPostingComment]   = useState(false);

  const [showReassign,     setShowReassign]     = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [reassigning,      setReassigning]      = useState(false);
  const [reassignError,    setReassignError]    = useState<string | null>(null); // ← NEW
  const [showStatusMenu,   setShowStatusMenu]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<ApiTicketDetail>(`/tickets/id/${ticketId}`),
      apiFetch<ApiAssignee[]>('/tickets/assignee-list'),
    ]).then(([t, a]) => {
      if (cancelled) return;
      setTicket(t); setAssigneeList(a); setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketId]);

  const commitStatus = async (s: string) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/status`, { method: 'PATCH', body: JSON.stringify({ new_status: s }) });
      const updated = await apiFetch<ApiTicketDetail>(`/tickets/id/${ticket.ticket_id}`);
      setTicket(updated); setPendingStatus(null); onUpdate();
    } catch { /* keep state */ } finally { setUpdatingStatus(false); }
  };

  const handleActionClick = (s: typeof STATUS_OPTIONS[number]) => {
    if (s === 'Solved' || s === 'Failed') {
      setPendingStatus(s);
    } else {
      commitStatus(s);
    }
  };

  const handleResolutionConfirm = async (comment: string) => {
    if (!ticket || !pendingStatus) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: comment, is_internal: true }),
      });
      await commitStatus(pendingStatus);
    } catch { /* silent */ } finally {
      setPendingStatus(null);
      setUpdatingStatus(false);
    }
  };

  const handleComment = async () => {
    if (!ticket || !commentText.trim()) return;
    setPostingComment(true);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim(), is_internal: commentType === 'internal' }),
      });
      if (pendingStatus) await commitStatus(pendingStatus);
      const updated = await apiFetch<ApiTicketDetail>(`/tickets/id/${ticket.ticket_id}`);
      setTicket(updated); setCommentText('');
    } catch { /* silent */ } finally { setPostingComment(false); }
  };

  // ─── UPDATED: handleReassign with error handling ───────────────────────────
  const handleReassign = async () => {
    if (!ticket || !selectedAssignee) return;
    setReassigning(true);
    setReassignError(null);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignee_id: selectedAssignee }),
      });
      const updated = await apiFetch<ApiTicketDetail>(`/tickets/id/${ticket.ticket_id}`);
      setTicket(updated);
      setShowReassign(false);
      setSelectedAssignee('');
      onUpdate();
    } catch (err) {
      setReassignError(err instanceof Error ? err.message : 'Reassign failed. Please try again.');
    } finally {
      setReassigning(false);
    }
  };

  const currentStatus = ticket?.status?.name ?? '';
  const priorityKey   = ticket?.priority?.toLowerCase() ?? 'medium';
  const prStyle       = PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES.medium;
  const stStyle       = STATUS_STYLES[currentStatus]  ?? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  const timeLeft      = timeUntil(ticket?.deadline ?? null);
  const commentCount  = ticket?.comments?.length ?? 0;
  const historyCount  = (ticket?.status_history?.length ?? 0) + (ticket?.assignment_history?.length ?? 0);
  const participantCount = 1 + (ticket?.followers?.length ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-2xl w-full max-w-xl h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading ticket…</div>
        ) : !ticket ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Ticket not found.</div>
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium mb-1">#{ticket.ticket_id}</p>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{ticket.title ?? '(Untitled)'}</h2>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors shrink-0 mt-1">
                  <X size={18} />
                </button>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status badge with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={updatingStatus}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all hover:opacity-80"
                    style={{ background: stStyle.bg, color: stStyle.text, borderColor: stStyle.border }}
                  >
                    {currentStatus.toUpperCase()}
                    <ChevronDown size={11} />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 min-w-[130px]">
                      {STATUS_OPTIONS.map((s) => {
                        const ss = STATUS_STYLES[s] ?? { bg: '#f1f5f9', text: '#475569' };
                        return (
                          <button
                            key={s}
                            onClick={() => handleActionClick(s)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                            style={{ color: ss.text }}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ss.text }} />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Priority badge */}
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full border"
                  style={{ background: prStyle.bg, color: prStyle.text, borderColor: prStyle.border }}
                >
                  {ticket.priority?.toUpperCase() ?? '—'}
                </span>

                {/* Category badge */}
                {ticket.category && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {ticket.category.name}
                  </span>
                )}

                {/* Time left */}
                <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  timeLeft.urgent
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  <Clock size={11} />
                  {timeLeft.label}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => handleActionClick('Solving')}
                  disabled={updatingStatus || currentStatus === 'Solving'}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <RotateCcw size={12} />
                  Start Solving
                </button>
                <button
                  onClick={() => handleActionClick('Solved')}
                  disabled={updatingStatus}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white text-green-600 border border-green-200 hover:bg-green-50 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle size={12} />
                  Mark Solved
                </button>
                <button
                  onClick={() => handleActionClick('Failed')}
                  disabled={updatingStatus}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  <XCircle size={12} />
                  Mark Failed
                </button>
                <button
                  onClick={() => { setShowReassign(!showReassign); setReassignError(null); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <UserRound size={12} />
                  Reassign
                </button>
              </div>

              {/* ─── UPDATED: Reassign panel — dropdown + error display ─── */}
              {showReassign && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-blue-700 font-medium">Select a new assignee:</p>

                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full text-sm text-slate-700 bg-white border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="" disabled>— Choose assignee —</option>
                    {assigneeList
                      .filter((a) => a.user_id !== ticket.assignee?.user_id)
                      .map((a) => (
                        <option key={a.user_id} value={a.user_id}>
                          {a.full_name ?? a.user_name ?? a.email}
                        </option>
                      ))}
                  </select>

                  {/* Error message */}
                  {reassignError && (
                    <p className="text-xs text-red-500 font-medium px-1">{reassignError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleReassign}
                      disabled={!selectedAssignee || reassigning}
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      {reassigning ? 'Reassigning…' : 'Confirm Reassign'}
                    </button>
                    <button
                      onClick={() => { setShowReassign(false); setSelectedAssignee(''); setReassignError(null); }}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── TABS ── */}
            <div className="flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 py-3 px-1 mr-5 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'comments'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare size={14} />
                  Comments ({commentCount})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 py-3 px-1 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'history'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <History size={14} />
                  History ({historyCount})
                </button>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users size={12} />
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* ── CREATOR / ASSIGNEE PILLS ── */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Creator</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {ticket.creator ? (ticket.creator.user_name ?? ticket.creator.full_name ?? ticket.creator.email) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assignee</span>
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                    {userInitial(ticket.assignee)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{userName(ticket.assignee)}</span>
                </div>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto">

              {/* COMMENTS TAB */}
              {activeTab === 'comments' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {commentCount === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        <MessageSquare size={32} strokeWidth={1.5} />
                        <p className="text-sm mt-2">No comments yet.</p>
                      </div>
                    )}
                    {ticket.comments?.map((c) => (
                      <div
                        key={c.comment_id}
                        className={`rounded-xl p-3 border ${
                          c.visibility === 'PRIVATE' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{userName(c.user)}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              c.visibility === 'PRIVATE' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                            }`}>
                              {c.visibility === 'PRIVATE' ? 'Internal' : 'Public'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Compose area */}
                  <div className="px-5 pb-5 shrink-0 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500 font-medium">Post as:</span>
                      <button
                        onClick={() => setCommentType('internal')}
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          commentType === 'internal'
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        🔒 Internal
                      </button>
                      <button
                        onClick={() => setCommentType('public')}
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          commentType === 'public'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        🌐 Public
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={
                          pendingStatus
                            ? `Describe the ${pendingStatus === 'Solved' ? 'resolution' : 'reason for failure'}…`
                            : commentType === 'internal'
                            ? 'Write an internal note…'
                            : 'Write a public reply…'
                        }
                        rows={3}
                        className="w-full px-4 py-3 pr-14 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-slate-400 focus:bg-white transition-all"
                      />
                      <button
                        onClick={handleComment}
                        disabled={!commentText.trim() || postingComment}
                        className={`absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold disabled:opacity-30 transition-colors ${
                          pendingStatus === 'Solved' ? 'bg-green-600 hover:bg-green-700'
                          : pendingStatus === 'Failed' ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-slate-900 hover:bg-slate-700'
                        }`}
                        title={pendingStatus ? `Confirm & Mark ${pendingStatus}` : 'Post comment'}
                      >
                        ↑
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="px-5 py-4 space-y-3">
                  <p className="text-xs text-slate-400">Read-only audit trail of all changes.</p>
                  {(() => {
                    type TimelineEntry =
                      | { kind: 'status'; item: ApiStatusHistory }
                      | { kind: 'assign'; item: ApiAssignmentHistory };

                    const entries: TimelineEntry[] = [
                      ...ticket.status_history.map((h): TimelineEntry => ({ kind: 'status', item: h })),
                      ...ticket.assignment_history.map((h): TimelineEntry => ({ kind: 'assign', item: h })),
                    ].sort((a, b) => new Date(a.item.changed_at).getTime() - new Date(b.item.changed_at).getTime());

                    if (entries.length === 0) {
                      return <p className="text-sm text-slate-400 text-center py-8">No history recorded yet.</p>;
                    }

                    return (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100" />
                        <div className="space-y-3 pl-10">
                          {entries.map((e, i) => {
                            if (e.kind === 'status') {
                              const h = e.item;
                              const oldSt = h.old_status ? STATUS_STYLES[h.old_status.name] : null;
                              const newSt = h.new_status ? STATUS_STYLES[h.new_status.name] : null;
                              return (
                                <div key={`s-${i}`} className="relative">
                                  <div className="absolute -left-6 top-3 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-slate-800">Status Change</span>
                                      <span className="text-[10px] text-slate-400">{timeAgo(h.changed_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">
                                      By <span className="font-semibold text-slate-700">{userName(h.changed_by)}</span>
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {oldSt && h.old_status && (
                                        <>
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: oldSt.bg, color: oldSt.text, borderColor: oldSt.border }}>
                                            {h.old_status.name}
                                          </span>
                                          <span className="text-slate-300 text-xs">→</span>
                                        </>
                                      )}
                                      {h.new_status && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: newSt?.bg ?? '#f1f5f9', color: newSt?.text ?? '#475569', borderColor: newSt?.border ?? '#e2e8f0' }}>
                                          {h.new_status.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              const h = e.item;
                              return (
                                <div key={`a-${i}`} className="relative">
                                  <div className="absolute -left-6 top-3 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white shadow-sm" />
                                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-slate-800">Reassigned</span>
                                      <span className="text-[10px] text-slate-400">{timeAgo(h.changed_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">
                                      By <span className="font-semibold text-slate-700">{userName(h.changed_by)}</span>
                                    </p>
                                    <p className="text-xs text-orange-600 font-medium">
                                      {userName(h.old_assignee)} → {userName(h.new_assignee)}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Resolution modal */}
      {pendingStatus && (
        <ResolutionModal
          targetStatus={pendingStatus}
          onConfirm={handleResolutionConfirm}
          onCancel={() => setPendingStatus(null)}
        />
      )}
    </div>
  );
}