'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Check, Pencil, ChevronDown, User, X,
  Clock, AlertTriangle, RefreshCw, MessageSquare,
  Send, Eye, EyeOff, Users, BarChart2, ArrowRight,
  History, UserCheck, GitBranch, Merge,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/AssigneeSidebar';
import { Header } from '@/components/layout/TicketTB';
import {
  MY_ACTIVE_TICKETS,
  MY_RESOLVED_TICKETS,
  ASSIGNEE_PERFORMANCE,
  OTHER_ASSIGNEES,
  ALL_ASSIGNEES,
  CURRENT_ASSIGNEE,
  STATUS_STYLES,
  PRIORITY_STYLE,
  getCatStyle,
  type AssigneeTicket,
  type ResolvedTicket,
  type TicketComment,
  type TicketHistoryEntry,
} from '@/lib/assignee-dashboard-data';
import { type TicketStatus, type DashboardAssignee } from '@/lib/admin-dashboard-data';

// ─── Status config (same palette as admin page) ───────────────────────────────

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

// Statuses an assignee is allowed to move to
const ASSIGNEE_ALLOWED_STATUSES: TicketStatus[] = ['new', 'assigned', 'solving', 'solved', 'failed', 'renew'];

const STATUS_TABS: { label: string; value: TicketStatus | 'all' | 'resolved' }[] = [
  { label: 'All Active',  value: 'all'      },
  { label: 'New',         value: 'new'      },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'Solving',     value: 'solving'  },
  { label: 'Renew',       value: 'renew'    },
  { label: 'Resolved',    value: 'resolved' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (h < 0)  return { text: 'Overdue',        urgent: true  };
  if (h < 6)  return { text: `${Math.round(h)}h left`, urgent: true  };
  if (h < 24) return { text: `${Math.round(h)}h left`, urgent: false };
  return { text: `${Math.floor(h / 24)}d left`, urgent: false };
}

// ─── Status Badge (same style as admin) ───────────────────────────────────────

function StatusBadge({
  status,
  onChange,
  readonly = false,
}: {
  status: TicketStatus;
  onChange?: (s: TicketStatus) => void;
  readonly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="relative">
      <div className={`flex items-center rounded-full border ${cfg.badgeBorder} overflow-hidden select-none`}>
        <span className={`text-[11px] font-bold px-3 py-1.5 ${cfg.badgeText} whitespace-nowrap`}>
          {cfg.label}
        </span>
        {!readonly && onChange && (
          <button
            onClick={() => setOpen((o) => !o)}
            className={`px-2 py-1.5 border-l ${cfg.badgeBorder} ${cfg.badgeText} hover:opacity-70 transition-opacity`}
          >
            <ChevronDown size={12} />
          </button>
        )}
      </div>

      {open && !readonly && onChange && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[140px]">
            {ASSIGNEE_ALLOWED_STATUSES.map((s) => {
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

// ─── Resolution Comment Modal (required for Solved / Failed) ─────────────────

function ResolutionModal({
  targetStatus,
  onConfirm,
  onCancel,
}: {
  targetStatus: 'solved' | 'failed';
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState('');
  const isSolved = targetStatus === 'solved';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-[480px]">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isSolved ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSolved
            ? <Check size={20} className="text-green-600" />
            : <X size={20} className="text-red-500" />}
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
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
        <div className="flex gap-3 mt-3">
          <button
            disabled={comment.trim().length === 0}
            onClick={() => onConfirm(comment.trim())}
            className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${
              isSolved
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-200'
                : 'bg-red-500 hover:bg-red-600 disabled:bg-red-200'
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

// ─── Reassign Modal ───────────────────────────────────────────────────────────

function ReassignModal({
  currentAssignee,
  onConfirm,
  onCancel,
}: {
  currentAssignee: DashboardAssignee;
  onConfirm: (assignees: DashboardAssignee[], note: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<DashboardAssignee[]>([]);
  const [note, setNote]         = useState('');

  const toggle = (a: DashboardAssignee) =>
    setSelected((prev) =>
      prev.some((x) => x.name === a.name)
        ? prev.filter((x) => x.name !== a.name)
        : [...prev, a],
    );

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-[480px]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <GitBranch size={17} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Reassign Ticket</h2>
            <p className="text-xs text-gray-400">Currently: {currentAssignee.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select new assignees</p>
          {selected.length > 0 && (
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              {selected.length} selected
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto mb-3">
          {OTHER_ASSIGNEES.map((a) => {
            const isSelected = selected.some((x) => x.name === a.name);
            return (
              <button
                key={a.name}
                onClick={() => toggle(a)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {a.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.role} · {a.department}</p>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected summary chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
            {selected.map((a) => (
              <span key={a.name} className="flex items-center gap-1 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full">
                {a.name}
                <button onClick={() => toggle(a)} className="hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for reassignment (optional)…"
          className="w-full h-20 text-sm text-gray-700 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-300 mb-4"
        />

        <div className="flex gap-3">
          <button
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected, note.trim())}
            className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Reassign{selected.length > 1 ? ` (${selected.length})` : ''}
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

// ─── Ticket Detail Drawer ─────────────────────────────────────────────────────

function TicketDetailDrawer({
  ticket,
  onClose,
  onStatusChange,
  onReassign,
  onCommentPost,
}: {
  ticket: AssigneeTicket;
  onClose: () => void;
  onStatusChange: (id: string, s: TicketStatus, comment?: string) => void;
  onReassign: (id: string, assignees: DashboardAssignee[], note: string) => void;
  onCommentPost: (id: string, text: string, type: 'internal' | 'public') => void;
}) {
  const [pendingStatus,    setPendingStatus]    = useState<'solved' | 'failed' | null>(null);
  const [showReassign,     setShowReassign]     = useState(false);
  const [commentText,      setCommentText]      = useState('');
  const [commentType,      setCommentType]      = useState<'internal' | 'public'>('internal');
  const [activeSection,    setActiveSection]    = useState<'comments' | 'history'>('comments');

  const cfg = STATUS_CONFIG[ticket.status];

  const handleStatusChange = (s: TicketStatus) => {
    if (s === 'solved' || s === 'failed') {
      setPendingStatus(s);
    } else {
      onStatusChange(ticket.ticketId, s);
    }
  };

  const handleResolutionConfirm = (comment: string) => {
    if (!pendingStatus) return;
    onStatusChange(ticket.ticketId, pendingStatus, comment);
    setPendingStatus(null);
    onClose();
  };

  const handlePost = () => {
    if (!commentText.trim()) return;
    onCommentPost(ticket.ticketId, commentText.trim(), commentType);
    setCommentText('');
  };

  const dl = deadlineLabel(ticket.deadline);

  // Participants — sourced directly from ticket data
  const participants = {
    creator:   ticket.creator,
    assignees: [ticket.assignee],
    followers: ticket.followers,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[620px] bg-white z-40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`border-l-4 ${cfg.borderColor} px-7 pt-6 pb-5 border-b border-gray-100 shrink-0`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs font-mono text-gray-400">#{ticket.ticketId}</span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{ticket.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors mt-0.5 shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} onChange={handleStatusChange} />

            {/* Priority */}
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: PRIORITY_STYLE[ticket.priority].bg,
                color: PRIORITY_STYLE[ticket.priority].color,
                borderColor: PRIORITY_STYLE[ticket.priority].dot,
              }}
            >
              {ticket.priority.toUpperCase()}
            </span>

            {/* Category */}
            <span
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={getCatStyle(ticket.category)}
            >
              {ticket.category}
            </span>

            {/* Deadline */}
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full ${
              dl.urgent ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
            }`}>
              {dl.urgent && <AlertTriangle size={10} />}
              <Clock size={10} />
              {dl.text}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => handleStatusChange('solving')}
              disabled={ticket.status === 'solving' || ticket.status === 'solved' || ticket.status === 'failed'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold hover:bg-yellow-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} /> Start Solving
            </button>
            <button
              onClick={() => handleStatusChange('solved')}
              disabled={ticket.status === 'solved'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={12} /> Mark Solved
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              disabled={ticket.status === 'failed'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X size={12} /> Mark Failed
            </button>
            <button
              onClick={() => setShowReassign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <GitBranch size={12} /> Reassign
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 px-7 py-3 border-b border-gray-100 shrink-0">
          {(['comments', 'history'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                activeSection === s ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {s === 'comments' ? <MessageSquare size={12} /> : <History size={12} />}
              {s === 'comments' ? `Comments (${ticket.comments.length})` : `History (${ticket.history.length})`}
            </button>
          ))}

          {/* Participants pill */}
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
            <Users size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-medium">
              {1 + participants.assignees.length + participants.followers.length} participants
            </span>
          </div>
        </div>

        {/* Participants bar */}
        <div className="px-7 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Creator</span>
              <span className="text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
                {participants.creator}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Assignee</span>
              <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full px-2.5 py-0.5">
                <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700">
                  {ticket.assignee.name.charAt(0)}
                </div>
                <span className="text-[11px] font-medium text-indigo-700">{ticket.assignee.name}</span>
              </div>
            </div>
            {participants.followers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Followers</span>
                <div className="flex items-center gap-1">
                  {participants.followers.map((f) => (
                    <div
                      key={f.name}
                      title={f.name}
                      className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 border border-white -ml-1 first:ml-0"
                    >
                      {f.name.charAt(0)}
                    </div>
                  ))}
                  <span className="text-[11px] text-gray-400 ml-1.5">
                    {participants.followers.map((f) => f.name).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {activeSection === 'comments' ? (
            <div className="flex flex-col gap-3">
              {ticket.comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No comments yet.</p>
              )}
              {ticket.comments.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-4 py-3 border text-sm ${
                    c.type === 'internal'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {c.author.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      c.type === 'internal'
                        ? 'bg-amber-200 text-amber-700'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {c.type === 'internal' ? 'INTERNAL' : 'PUBLIC'}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(c.timestamp)}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {ticket.history.map((h, i) => {
                const isCurrent = i === ticket.history.length - 1;
                return (
                  <div key={i} className={`flex gap-3 ${isCurrent ? '' : 'opacity-80'}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isCurrent ? 'bg-gray-900' : 'bg-gray-200'
                      }`}>
                        <History size={12} className={isCurrent ? 'text-white' : 'text-gray-500'} />
                      </div>
                      {i < ticket.history.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className={`flex-1 pb-4 rounded-xl px-3 py-2.5 border text-xs ${
                      isCurrent ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{h.action}</span>
                        {h.oldStatus && (
                          <>
                            <StatusBadge status={h.oldStatus} readonly />
                            <ArrowRight size={10} className="text-gray-400" />
                          </>
                        )}
                        <StatusBadge status={h.newStatus} readonly />
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span>by <span className="font-medium text-gray-600">{h.by}</span></span>
                        <span>·</span>
                        <span>{timeAgo(h.timestamp)}</span>
                      </div>
                      {h.detail && (
                        <p className="mt-1.5 text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2">
                          {h.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="px-7 py-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500">Post as:</span>
            <button
              onClick={() => setCommentType('internal')}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                commentType === 'internal'
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'border-gray-200 text-gray-400 hover:text-gray-600'
              }`}
            >
              <EyeOff size={11} /> Internal
            </button>
            <button
              onClick={() => setCommentType('public')}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                commentType === 'public'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'border-gray-200 text-gray-400 hover:text-gray-600'
              }`}
            >
              <Eye size={11} /> Public
            </button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={commentType === 'internal' ? 'Write an internal note…' : 'Write a public reply to the client…'}
              className="flex-1 h-20 text-sm text-gray-700 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-300"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handlePost(); }}
            />
            <button
              onClick={handlePost}
              disabled={!commentText.trim()}
              className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0 mb-0.5"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {pendingStatus && (
        <ResolutionModal
          targetStatus={pendingStatus}
          onConfirm={handleResolutionConfirm}
          onCancel={() => setPendingStatus(null)}
        />
      )}
      {showReassign && (
        <ReassignModal
          currentAssignee={ticket.assignee}
          onConfirm={(assignees, note) => {
            onReassign(ticket.ticketId, assignees, note);
            setShowReassign(false);
          }}
          onCancel={() => setShowReassign(false)}
        />
      )}
    </>
  );
}

// ─── Ticket Row (active + resolved) ──────────────────────────────────────────

function TicketRow({
  ticket,
  onOpen,
}: {
  ticket:  AssigneeTicket | ResolvedTicket;
  onOpen?: (t: AssigneeTicket) => void;
}) {
  const cfg      = STATUS_CONFIG[ticket.status];
  const isActive = 'deadline' in ticket;
  const active   = isActive ? (ticket as AssigneeTicket)   : null;
  const resolved = !isActive ? (ticket as ResolvedTicket) : null;
  const dl       = active ? deadlineLabel(active.deadline) : null;
  const formattedDate = ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={`border-l-4 ${cfg.borderColor} bg-white rounded-xl shadow-sm border border-gray-100 ${isActive ? 'hover:bg-gray-50/40 transition-colors duration-150' : ''}`}>
      <div className={`flex items-center gap-6 px-6 ${isActive ? 'py-4' : 'py-3'}`}>

        {/* ID + date */}
        <div className="flex flex-col gap-0.5 w-[120px] shrink-0">
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

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {active && onOpen ? (
            <>
              <button
                onClick={() => onOpen(active)}
                className="text-sm font-semibold text-gray-800 mb-3 text-left hover:underline cursor-pointer decoration-gray-400 underline-offset-2 transition-all"
              >
                {ticket.title}
              </button>
              <div className="grid grid-cols-4 gap-4">
                {([
                  { label: 'Category', value: ticket.category },
                  { label: 'Priority', value: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) },
                  { label: 'Assignee', value: active.assignee.name },
                  { label: 'Comments', value: `${active.comments.length} comment${active.comments.length !== 1 ? 's' : ''}` },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-gray-600 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-700">{ticket.title}</span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={getCatStyle(ticket.category)}>
            {ticket.category}
          </span>
          <StatusBadge status={ticket.status} readonly />
          {active && onOpen && (
            <div className="flex flex-col gap-1">
              <button onClick={() => onOpen(active)} className="text-gray-300 hover:text-gray-900 transition-colors" title="Open ticket">
                <Pencil size={13} />
              </button>
              <button onClick={() => onOpen(active)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <MessageSquare size={13} />
              </button>
            </div>
          )}
          {resolved && (
            <span className="text-xs text-gray-400">
              {resolved.resolvedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
// ─── Performance Dashboard ────────────────────────────────────────────────────

function PerformanceDashboard({ onClose }: { onClose: () => void }) {
  const p = ASSIGNEE_PERFORMANCE;
  const stats = [
    { label: 'Active Tickets',       value: p.activeCount,             sub: 'Currently assigned',       color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { label: 'Solved (30d)',          value: p.solvedLast30,            sub: 'Last 30 days',             color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-100'  },
    { label: 'Failed (30d)',          value: p.failedLast30,            sub: 'Last 30 days',             color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-100'    },
    { label: 'Resolution Rate',       value: `${p.resolutionRatePct}%`, sub: 'Solved / total closed',    color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
    { label: 'Avg First Response',    value: `${p.avgFirstResponseHours}h`, sub: 'Across all tickets',  color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100'  },
    { label: 'Critical Open',         value: p.criticalCount,           sub: 'Needs immediate attention', color: p.criticalCount > 0 ? 'text-red-600' : 'text-gray-600', bg: p.criticalCount > 0 ? 'bg-red-50' : 'bg-gray-50', border: p.criticalCount > 0 ? 'border-red-100' : 'border-gray-100' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-[600px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <BarChart2 size={17} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">My Performance</h2>
              <p className="text-xs text-gray-400">{CURRENT_ASSIGNEE.name} · {CURRENT_ASSIGNEE.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
              <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
              <div className="text-xs font-semibold text-gray-700">{s.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Assigned (all time)</p>
          <p className="text-lg font-bold text-gray-900">{p.totalAssigned} tickets</p>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssigneeTicketsPage() {
  const [activeTab,       setActiveTab]       = useState<TicketStatus | 'all' | 'resolved'>('all');
  const [activeTickets,   setActiveTickets]   = useState<AssigneeTicket[]>(MY_ACTIVE_TICKETS);
  const [openTicket,      setOpenTicket]      = useState<AssigneeTicket | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  // Filtered list
  const filtered = useMemo(() => {
    if (activeTab === 'resolved') return [];
    return activeTickets.filter((t) => activeTab === 'all' || t.status === activeTab);
  }, [activeTab, activeTickets]);

  // Counts
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all:      activeTickets.length,
      resolved: MY_RESOLVED_TICKETS.length,
    };
    activeTickets.forEach((t) => { map[t.status] = (map[t.status] ?? 0) + 1; });
    return map;
  }, [activeTickets]);

  // Handlers
  const handleStatusChange = (id: string, status: TicketStatus, comment?: string) => {
    setActiveTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId !== id) return t;
        const newHistory: TicketHistoryEntry = {
          action:    'Status Change',
          oldStatus: t.status,
          newStatus: status,
          by:        CURRENT_ASSIGNEE.name,
          timestamp: new Date(),
        };
        const newComments = comment
          ? [...t.comments, { author: CURRENT_ASSIGNEE.name, type: 'internal' as const, text: comment, timestamp: new Date() }]
          : t.comments;
        return { ...t, status, history: [...t.history, newHistory], comments: newComments };
      }),
    );
    // Update open ticket if it's the same
    if (openTicket?.ticketId === id) {
      setOpenTicket((prev) => {
        if (!prev) return null;
        const newHistory: TicketHistoryEntry = {
          action: 'Status Change', oldStatus: prev.status, newStatus: status,
          by: CURRENT_ASSIGNEE.name, timestamp: new Date(),
        };
        return { ...prev, status, history: [...prev.history, newHistory] };
      });
    }
  };

  const handleReassign = (id: string, assignees: DashboardAssignee[], note: string) => {
    const names = assignees.map((a) => a.name).join(', ');
    setActiveTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId !== id) return t;
        const detail = note || `Reassigned from ${t.assignee.name} to ${names}`;
        const newHistory: TicketHistoryEntry = {
          action:    'Reassigned',
          oldStatus: t.status,
          newStatus: 'assigned',
          by:        CURRENT_ASSIGNEE.name,
          detail,
          timestamp: new Date(),
        };
        // Primary assignee = first selected; rest stored in followers
        const [primary, ...rest] = assignees;
        const updatedFollowers = [...t.followers, ...rest.filter((a) => !t.followers.some((f) => f.name === a.name))];
        return { ...t, assignee: primary, followers: updatedFollowers, status: 'assigned', history: [...t.history, newHistory] };
      }),
    );
    if (openTicket?.ticketId === id) {
      const [primary] = assignees;
      setOpenTicket((prev) => prev ? { ...prev, assignee: primary, status: 'assigned' } : null);
    }
  };

  const handleCommentPost = (id: string, text: string, type: 'internal' | 'public') => {
    const newComment: TicketComment = { author: CURRENT_ASSIGNEE.name, type, text, timestamp: new Date() };
    setActiveTickets((prev) =>
      prev.map((t) => t.ticketId === id ? { ...t, comments: [...t.comments, newComment] } : t),
    );
    if (openTicket?.ticketId === id) {
      setOpenTicket((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userName={CURRENT_ASSIGNEE.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Sub-header: user info + performance button */}
        <div className="flex items-center justify-between px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
              {CURRENT_ASSIGNEE.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{CURRENT_ASSIGNEE.name}</p>
              <p className="text-xs text-gray-400">{CURRENT_ASSIGNEE.role} · {CURRENT_ASSIGNEE.department}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPerformance(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
          >
            <BarChart2 size={14} />
            My Performance
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
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

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'resolved' ? (
            <div className="flex flex-col gap-2">
              {MY_RESOLVED_TICKETS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Check size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No resolved tickets yet</p>
                </div>
              ) : (
                MY_RESOLVED_TICKETS.map((t) => <TicketRow key={t.ticketId} ticket={t} />)
              )}
            </div>
          ) : filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filtered.map((ticket) => (
                <TicketRow key={ticket.ticketId} ticket={ticket} onOpen={setOpenTicket} />
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

      {/* Ticket Detail Drawer */}
      {openTicket && (
        <TicketDetailDrawer
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
          onStatusChange={handleStatusChange}
          onReassign={handleReassign}
          onCommentPost={handleCommentPost}
        />
      )}

      {/* Performance Modal */}
      {showPerformance && (
        <PerformanceDashboard onClose={() => setShowPerformance(false)} />
      )}
    </div>
  );
}