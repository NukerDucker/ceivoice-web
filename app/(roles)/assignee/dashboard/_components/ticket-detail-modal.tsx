"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  New:      { bg: '#dbeafe', text: '#1e40af' },
  Assigned: { bg: '#e0e7ff', text: '#3730a3' },
  Solving:  { bg: '#fef3c2', text: '#92400e' },
  Solved:   { bg: '#dcfce7', text: '#166534' },
  Failed:   { bg: '#fee2e2', text: '#991b1b' },
  Renew:    { bg: '#f3e8ff', text: '#6b21a8' },
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

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketDetailModal({ ticketId, onClose, onUpdate }: TicketDetailModalProps) {
  const [ticket,           setTicket]           = useState<ApiTicketDetail | null>(null);
  const [assigneeList,     setAssigneeList]     = useState<ApiAssignee[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setActiveTab]        = useState<'details' | 'history' | 'comments'>('details');

  const [updatingStatus,   setUpdatingStatus]   = useState(false);
  const [pendingStatus,    setPendingStatus]    = useState<'Solved' | 'Failed' | null>(null);

  const [commentText,      setCommentText]      = useState('');
  const [commentType,      setCommentType]      = useState<'internal' | 'public'>('internal');
  const [postingComment,   setPostingComment]   = useState(false);

  const [showReassign,     setShowReassign]     = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [reassigning,      setReassigning]      = useState(false);

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

  const handleStatusClick = (s: typeof STATUS_OPTIONS[number]) => {
    if (s === 'Solved' || s === 'Failed') { setPendingStatus(s); setActiveTab('comments'); }
    else commitStatus(s);
  };

  const commitStatus = async (s: string) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/status`, { method: 'PATCH', body: JSON.stringify({ new_status: s }) });
      const updated = await apiFetch<ApiTicketDetail>(`/tickets/id/${ticket.ticket_id}`);
      setTicket(updated); setPendingStatus(null); onUpdate();
    } catch { /* keep state */ } finally { setUpdatingStatus(false); }
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

  const handleReassign = async () => {
    if (!ticket || !selectedAssignee) return;
    setReassigning(true);
    try {
      await apiFetch(`/tickets/id/${ticket.ticket_id}/assign`, { method: 'POST', body: JSON.stringify({ assignee_id: selectedAssignee }) });
      const updated = await apiFetch<ApiTicketDetail>(`/tickets/id/${ticket.ticket_id}`);
      setTicket(updated); setShowReassign(false); setSelectedAssignee(''); onUpdate();
    } catch { /* silent */ } finally { setReassigning(false); }
  };

  const currentStatus = ticket?.status?.name ?? '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {ticket && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  #{ticket.ticket_id}
                </span>
                {ticket.category && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {ticket.category.name}
                  </span>
                )}
              </div>
            )}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {loading ? 'Loading…' : (ticket?.title ?? '(Untitled)')}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs — scrollable on mobile so they never wrap */}
        <div className="flex border-b border-slate-200 shrink-0 px-4 sm:px-6 overflow-x-auto scrollbar-none">
          {(['details', 'history', 'comments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-4 sm:mr-6 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'history' ? 'Audit Log' : tab === 'comments' ? 'Communication' : 'Details & Actions'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading ticket…</div>
          )}

          {!loading && ticket && (
            <>
              {/* ── DETAILS TAB ── */}
              {activeTab === 'details' && (
                <div className="space-y-5">

                  {/* Info cards — 3 cols on sm+, single row on mobile */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                      <span className="text-xs sm:text-sm font-bold capitalize text-slate-800">{ticket.priority}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Opened</p>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">{timeAgo(ticket.created_at)}</span>
                    </div>
                  </div>

                  {ticket.summary && (
                    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</p>
                      <p className="text-sm text-slate-700">{ticket.summary}</p>
                    </div>
                  )}

                  {/* Status controls */}
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => {
                        const st       = STATUS_STYLES[s] ?? { bg: '#f1f5f9', text: '#475569' };
                        const isActive = currentStatus === s;
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusClick(s)}
                            disabled={updatingStatus}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 disabled:opacity-50 ${
                              isActive ? 'border-current shadow-md scale-[1.02]' : 'border-transparent opacity-60 hover:opacity-90'
                            }`}
                            style={{ background: st.bg, color: st.text }}
                          >
                            {isActive && '✓ '}{s.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reassign */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-700">Reassignment</p>
                      <button
                        onClick={() => setShowReassign(!showReassign)}
                        disabled={ticket.status?.name === 'Solving' || ticket.status?.name === 'Solved'}
                        className="text-xs font-semibold px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={ticket.status?.name === 'Solving' || ticket.status?.name === 'Solved' ? 'Cannot reassign tickets in Solving or Solved status' : 'Reassign ticket to another assignee'}
                      >
                        ↗ Reassign Ticket
                      </button>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100 w-fit max-w-full">
                      <div className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {userInitial(ticket.assignee)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{userName(ticket.assignee)}</p>
                        <p className="text-[10px] text-slate-400">Current assignee</p>
                      </div>
                    </div>

                    {showReassign && (
                      <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 space-y-3">
                        <p className="text-xs text-orange-700 font-medium">Select an assignee to redirect this ticket:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {assigneeList
                            .filter((a) => a.user_id !== ticket.assignee?.user_id)
                            .map((a) => (
                              <label
                                key={a.user_id}
                                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-orange-100 cursor-pointer hover:border-orange-300 transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="reassign"
                                  value={a.user_id}
                                  checked={selectedAssignee === a.user_id}
                                  onChange={() => setSelectedAssignee(a.user_id)}
                                  className="accent-orange-500"
                                />
                                <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                  {userInitial(a)}
                                </div>
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {a.full_name ?? a.user_name ?? a.email}
                                </p>
                              </label>
                            ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleReassign}
                            disabled={!selectedAssignee || reassigning}
                            className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-40 transition-colors"
                          >
                            {reassigning ? 'Reassigning…' : 'Confirm Reassign'}
                          </button>
                          <button
                            onClick={() => { setShowReassign(false); setSelectedAssignee(''); }}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── AUDIT LOG TAB ── */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-medium">Read-only audit trail of all status changes and reassignments.</p>
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
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
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
                                    <p className="text-xs text-slate-500">
                                      By: <span className="font-semibold text-slate-700">{userName(h.changed_by)}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {oldSt && h.old_status && (
                                        <>
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: oldSt.bg, color: oldSt.text }}>
                                            {h.old_status.name.toUpperCase()}
                                          </span>
                                          <span className="text-slate-400 text-xs">→</span>
                                        </>
                                      )}
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: newSt?.bg ?? '#f1f5f9', color: newSt?.text ?? '#475569' }}>
                                        {h.new_status?.name.toUpperCase()}
                                      </span>
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
                                    <p className="text-xs text-slate-500">
                                      By: <span className="font-semibold text-slate-700">{userName(h.changed_by)}</span>
                                    </p>
                                    <p className="text-xs text-orange-600 font-medium mt-1">
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

              {/* ── COMMUNICATION TAB ── */}
              {activeTab === 'comments' && (
                // Stacks vertically on mobile, side-by-side on sm+
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* Resolution banner */}
                    {pendingStatus && (
                      <div className={`rounded-xl px-3 sm:px-4 py-3 border flex items-start gap-3 ${
                        pendingStatus === 'Solved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <span className="text-lg shrink-0">{pendingStatus === 'Solved' ? '✅' : '❌'}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${pendingStatus === 'Solved' ? 'text-green-700' : 'text-red-700'}`}>
                            Resolution comment required to mark as {pendingStatus.toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Please describe the resolution or reason for failure.</p>
                        </div>
                        <button onClick={() => setPendingStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600 shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Comment thread */}
                    <div className="space-y-3 min-h-[80px]">
                      {(ticket.comments?.length ?? 0) === 0 && (
                        <p className="text-sm text-slate-400 text-center py-6">No comments yet.</p>
                      )}
                      {ticket.comments?.map((c) => (
                        <div
                          key={c.comment_id}
                          className={`rounded-xl p-3 border ${
                            c.visibility === 'PRIVATE' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start sm:items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-800">{userName(c.user)}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.visibility === 'PRIVATE' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'
                              }`}>
                                {c.visibility === 'PRIVATE' ? '🔒 INTERNAL' : '🌐 PUBLIC'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-slate-700">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Compose */}
                    <div className={`border rounded-xl overflow-hidden ${pendingStatus ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'}`}>
                      <div className="flex border-b border-slate-200">
                        {(['internal', 'public'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setCommentType(t)}
                            className={`flex-1 py-2 text-xs font-semibold transition-all capitalize ${
                              commentType === t
                                ? t === 'internal' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {t === 'internal' ? '🔒 Internal Note' : '🌐 Public Reply'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={pendingStatus
                          ? `Describe the ${pendingStatus === 'Solved' ? 'resolution' : 'reason for failure'}…`
                          : commentType === 'internal'
                          ? 'Write an internal note visible only to the team…'
                          : 'Write a public reply visible to the customer…'}
                        className="w-full p-3 text-sm text-slate-700 resize-none outline-none min-h-[80px] bg-white"
                      />
                      <div className="flex justify-end px-3 pb-3 gap-2 flex-wrap">
                        {pendingStatus && (
                          <button
                            onClick={() => setPendingStatus(null)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={handleComment}
                          disabled={!commentText.trim() || postingComment}
                          className={`px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-40 transition-colors ${
                            pendingStatus === 'Solved' ? 'bg-green-600 hover:bg-green-700'
                            : pendingStatus === 'Failed' ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-slate-900 hover:bg-slate-700'
                          }`}
                        >
                          {postingComment ? 'Posting…' : pendingStatus ? `Confirm & Mark ${pendingStatus.toUpperCase()}` : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right sidebar — full width on mobile, fixed width on sm+ */}
                  <div className="w-full sm:w-52 shrink-0 flex flex-row sm:flex-col gap-3 sm:gap-4">
                    <div className="flex-1 sm:flex-none">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assignee</p>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {userInitial(ticket.assignee)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{userName(ticket.assignee)}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ticket.assignee?.email ?? ''}</p>
                        </div>
                      </div>
                    </div>
                    {(ticket.followers?.length ?? 0) > 0 && (
                      <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Followers</p>
                        <div className="space-y-1.5">
                          {ticket.followers?.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {userInitial(f.user)}
                              </div>
                              <p className="text-xs font-semibold text-slate-800 truncate">{userName(f.user)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}