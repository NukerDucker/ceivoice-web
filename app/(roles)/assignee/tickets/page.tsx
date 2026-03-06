'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Check, Pencil, ChevronDown, X,
  Clock, AlertTriangle, RefreshCw, MessageSquare,
  Send, Eye, EyeOff, Users, BarChart2, ArrowRight,
  History, UserCheck, GitBranch, Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/TicketTB';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { PRIORITY_STYLES as PRIORITY_STYLE } from '@/lib/config';
import { getCatStyle } from '@/lib/utils';
import type {
  AssigneeTicket,
  AssigneeResolvedTicket as ResolvedTicket,
  AssigneeTicketComment as TicketComment,
  TicketHistoryEntry,
  TicketStatus,
  DashboardAssignee,
} from '@/types';
import type { ApiUser, ApiTicket as ApiTicketRaw, ApiComment, ApiHistoryEntry } from '@/types/api';

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

function mapApiComment(c: ApiComment): TicketComment {
  return {
    author:    apiUserName(c.user),
    type:      c.visibility === 'PRIVATE' ? 'internal' : 'public',
    text:      c.content,
    timestamp: new Date(c.created_at),
  };
}

function mapHistoryEntry(h: ApiHistoryEntry): TicketHistoryEntry {
  if (h.type === 'assignment_change') {
    return {
      type:        'reassignment',
      action:      'Reassigned',
      oldStatus:   null,
      newStatus:   'assigned' as TicketStatus,
      by:          h.changed_by?.name ?? 'System',
      oldAssignee: h.old_assignee?.name ?? null,
      newAssignee: h.new_assignee?.name ?? 'Unassigned',
      detail:      h.change_reason ?? undefined,
      timestamp:   new Date(h.timestamp),
    };
  }
  return {
    type:      'status_change',
    action:    h.old_status ? 'Status Change' : 'Created',
    oldStatus: h.old_status ? toTicketStatus(h.old_status) : null,
    newStatus: toTicketStatus(h.new_status),
    by:        h.changed_by?.name ?? 'System',
    detail:    h.change_reason ?? undefined,
    timestamp: new Date(h.timestamp),
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

const ASSIGNEE_ALLOWED_STATUSES: TicketStatus[] = ['new', 'assigned', 'solving', 'solved', 'failed', 'renew'];

const STATUS_TABS: { label: string; value: TicketStatus | 'all' | 'resolved' }[] = [
  { label: 'All Active',  value: 'all'      },
  { label: 'New',         value: 'new'      },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'Solving',     value: 'solving'  },
  { label: 'Renew',       value: 'renew'    },
  { label: 'Resolved',    value: 'resolved' },
];

const STATUS_API_MAP: Record<string, string> = {
  draft: 'Draft', new: 'New', assigned: 'Assigned',
  solving: 'Solving', solved: 'Solved', failed: 'Failed', renew: 'Renew',
};

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
      <div className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8 w-full sm:max-w-[480px]">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4 sm:hidden" />
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

function ReassignModal({
  currentAssignee,
  availableAssignees,
  onConfirm,
  onCancel,
}: {
  currentAssignee: DashboardAssignee;
  availableAssignees: ApiUser[];
  onConfirm: (users: ApiUser[], note: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<ApiUser[]>([]);
  const [note, setNote]         = useState('');

  const toggle = (a: ApiUser) =>
    setSelected((prev) =>
      prev.some((x) => x.user_id === a.user_id)
        ? prev.filter((x) => x.user_id !== a.user_id)
        : [...prev, a],
    );

  const candidates = availableAssignees.filter(
    (a) => apiUserName(a) !== currentAssignee.name,
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8 w-full sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4 sm:hidden" />
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select new assignee</p>
          {selected.length > 0 && (
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              {selected.length} selected
            </span>
          )}
        </div>

        {candidates.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No other assignees available.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[40vh] sm:max-h-52 overflow-y-auto mb-3">
            {candidates.map((a) => {
              const name = apiUserName(a);
              const isSelected = selected.some((x) => x.user_id === a.user_id);
              return (
                <button
                  key={a.user_id}
                  onClick={() => toggle(a)}
                  className={`flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">{a.role}</p>
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
        )}

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
            {selected.map((a) => (
              <span key={a.user_id} className="flex items-center gap-1 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full">
                {apiUserName(a)}
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

function TicketDetailDrawer({
  ticket,
  availableAssignees,
  onClose,
  onStatusChange,
  onReassign,
  onCommentPost,
}: {
  ticket: AssigneeTicket;
  availableAssignees: ApiUser[];
  onClose: () => void;
  onStatusChange: (id: string, s: TicketStatus, comment?: string) => void;
  onReassign: (id: string, users: ApiUser[], note: string) => void;
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

  const participants = {
    creator:   ticket.creator,
    assignees: [ticket.assignee],
    followers: ticket.followers,
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[620px] bg-white z-40 shadow-2xl flex flex-col overflow-hidden">
        <div className={`border-l-4 ${cfg.borderColor} px-4 sm:px-7 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-gray-100 shrink-0`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs font-mono text-gray-400">#{ticket.ticketId}</span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{ticket.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors mt-0.5 shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <StatusBadge status={ticket.status} onChange={handleStatusChange} />

            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full border shrink-0"
              style={{
                backgroundColor: PRIORITY_STYLE[ticket.priority].bg,
                color: PRIORITY_STYLE[ticket.priority].color,
                borderColor: PRIORITY_STYLE[ticket.priority].dot,
              }}
            >
              {ticket.priority.toUpperCase()}
            </span>

            <span
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full shrink-0"
              style={getCatStyle(ticket.category)}
            >
              {ticket.category}
            </span>

            <span className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full shrink-0 ${
              dl.urgent ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
            }`}>
              {dl.urgent && <AlertTriangle size={10} />}
              <Clock size={10} />
              {dl.text}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => handleStatusChange('solving')}
              disabled={ticket.status === 'solving' || ticket.status === 'solved' || ticket.status === 'failed'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold hover:bg-yellow-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <RefreshCw size={12} /> Start Solving
            </button>
            <button
              onClick={() => handleStatusChange('solved')}
              disabled={ticket.status === 'solved'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Check size={12} /> Mark Solved
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              disabled={ticket.status === 'failed'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <X size={12} /> Mark Failed
            </button>
            <button
              onClick={() => setShowReassign(true)}
              disabled={ticket.status === 'solving' || ticket.status === 'solved'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              title={ticket.status === 'solving' || ticket.status === 'solved' ? 'Cannot reassign tickets in Solving or Solved status' : 'Reassign ticket to another assignee'}
            >
              <GitBranch size={12} /> Reassign
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 sm:px-7 py-3 border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
          {(['comments', 'history'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize whitespace-nowrap shrink-0 ${
                activeSection === s ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {s === 'comments' ? <MessageSquare size={12} /> : <History size={12} />}
              {s === 'comments' ? `Comments (${ticket.comments.length})` : `History (${ticket.history.length})`}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 shrink-0">
            <Users size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
              {1 + participants.assignees.length + participants.followers.length} participants
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-7 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-14 sm:w-auto">Creator</span>
              <span className="text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-0.5 truncate max-w-[180px]">
                {participants.creator}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-14 sm:w-auto">Assignee</span>
              <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full px-2.5 py-0.5 max-w-[180px]">
                <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700 shrink-0">
                  {ticket.assignee.name.charAt(0)}
                </div>
                <span className="text-[11px] font-medium text-indigo-700 truncate">{ticket.assignee.name}</span>
              </div>
            </div>
            {participants.followers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-14 sm:w-auto">Followers</span>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {participants.followers.map((f) => (
                    <div
                      key={f.name}
                      title={f.name}
                      className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 border border-white -ml-1 first:ml-0 shrink-0"
                    >
                      {f.name.charAt(0)}
                    </div>
                  ))}
                  <span className="text-[11px] text-gray-400 ml-1.5 truncate max-w-[120px]">
                    {participants.followers.map((f) => f.name).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-5">
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
                const isReassignment = h.type === 'reassignment';

                let iconBg: string;
                if (isCurrent && isReassignment)       iconBg = 'bg-indigo-600';
                else if (isCurrent)                    iconBg = 'bg-gray-900';
                else if (isReassignment)               iconBg = 'bg-indigo-100';
                else                                   iconBg = 'bg-gray-200';

                let cardBg: string;
                if (isCurrent && isReassignment)       cardBg = 'bg-indigo-50 border-indigo-200';
                else if (isCurrent)                    cardBg = 'bg-gray-50 border-gray-200';
                else                                   cardBg = 'bg-white border-gray-100';
                return (
                  <div key={i} className={`flex gap-3 ${isCurrent ? '' : 'opacity-80'}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                        {isReassignment
                          ? <UserCheck size={12} className={isCurrent ? 'text-white' : 'text-indigo-500'} />
                          : <History   size={12} className={isCurrent ? 'text-white' : 'text-gray-500'} />
                        }
                      </div>
                      {i < ticket.history.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className={`flex-1 pb-4 rounded-xl px-3 py-2.5 border text-xs ${cardBg}`}>
                      {isReassignment ? (
                        <>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-indigo-700">{h.action}</span>
                            {h.oldAssignee ? (
                              <>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600">
                                  {h.oldAssignee}
                                </span>
                                <ArrowRight size={10} className="text-gray-400" />
                              </>
                            ) : null}
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700">
                              {h.newAssignee ?? 'Unassigned'}
                            </span>
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
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-7 py-3 sm:py-4 border-t border-gray-100 bg-white shrink-0">
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
              className="flex-1 h-16 sm:h-20 text-sm text-gray-700 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-300"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handlePost(); }}
            />
            <button
              onClick={handlePost}
              disabled={!commentText.trim()}
              className="w-11 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0 mb-0.5"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

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
          availableAssignees={availableAssignees}
          onConfirm={(users, note) => {
            onReassign(ticket.ticketId, users, note);
            setShowReassign(false);
          }}
          onCancel={() => setShowReassign(false)}
        />
      )}
    </>
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

              {/* ── FIXED: flex with fixed-width columns so every row aligns ── */}
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

              {/* Mobile: 2-col grid (unchanged) */}
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
  const [activeTab,        setActiveTab]        = useState<TicketStatus | 'all' | 'resolved'>('all');
  const [activeTickets,    setActiveTickets]    = useState<AssigneeTicket[]>([]);
  const [resolvedTickets,  setResolvedTickets]  = useState<ResolvedTicket[]>([]);
  const [assigneeList,     setAssigneeList]     = useState<ApiUser[]>([]);
  const [ticketsLoading,   setTicketsLoading]   = useState(true);
  const [openTicket,       setOpenTicket]       = useState<AssigneeTicket | null>(null);
  const [showPerformance,  setShowPerformance]  = useState(false);
  const [currentUserName,  setCurrentUserName]  = useState('Assignee');

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

  useEffect(() => {
    Promise.all([
      apiFetch<ApiTicketRaw[]>('/tickets/assigned'),
      apiFetch<ApiTicketRaw[]>('/tickets/assigned?resolved=true'),
      apiFetch<ApiUser[]>('/tickets/assignee-list'),
    ])
      .then(([active, resolved, assignees]) => {
        setActiveTickets(active.map(mapApiTicket));
        setResolvedTickets(resolved.map(mapResolvedTicket));
        setAssigneeList(assignees);
      })
      .catch((err) => console.error('initial fetch:', err))
      .finally(() => setTicketsLoading(false));
  }, []);

  const handleOpenTicket = useCallback(async (ticket: AssigneeTicket) => {
    setOpenTicket(ticket);
    try {
      const [rawComments, historyRes] = await Promise.all([
        apiFetch<ApiComment[]>(`/tickets/id/${ticket.ticketId}/comments`),
        apiFetch<{ history: ApiHistoryEntry[] }>(`/tickets/id/${ticket.ticketId}/history`),
      ]);
      const comments = rawComments.map(mapApiComment);
      const history  = (historyRes.history ?? []).map(mapHistoryEntry);
      setActiveTickets((prev) =>
        prev.map((t) => t.ticketId === ticket.ticketId ? { ...t, comments, history } : t),
      );
      setOpenTicket((prev) => prev ? { ...prev, comments, history } : null);
    } catch (err) {
      console.error('fetch ticket details:', err);
    }
  }, []);

  const handleOpenResolvedTicket = useCallback(async (ticket: ResolvedTicket) => {
    const shell: AssigneeTicket = {
      ticketId:  ticket.ticketId,
      title:     ticket.title,
      category:  ticket.category,
      status:    ticket.status as TicketStatus,
      priority:  ticket.priority,
      date:      ticket.date,
      deadline:  ticket.resolvedDate,
      assignee:  { name: '…', fallback: '?', role: '', department: '' },
      creator:   '',
      followers: [],
      history:   [],
      comments:  [],
    };
    setOpenTicket(shell);
    try {
      const [rawComments, historyRes, fullRaw] = await Promise.all([
        apiFetch<ApiComment[]>(`/tickets/id/${ticket.ticketId}/comments`),
        apiFetch<{ history: ApiHistoryEntry[] }>(`/tickets/id/${ticket.ticketId}/history`),
        apiFetch<ApiTicketRaw>(`/tickets/id/${ticket.ticketId}`),
      ]);
      const comments = rawComments.map(mapApiComment);
      const history  = (historyRes.history ?? []).map(mapHistoryEntry);
      setOpenTicket({
        ...mapApiTicket(fullRaw),
        status:   ticket.status as TicketStatus,
        comments,
        history,
      });
    } catch (err) {
      console.error('fetch resolved ticket details:', err);
    }
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: TicketStatus, comment?: string) => {
    try {
      await apiFetch(`/tickets/id/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: STATUS_API_MAP[status] ?? status }),
      });
      if (comment) {
        await apiFetch(`/tickets/id/${id}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: comment, is_internal: true }),
        });
      }
    } catch (err) {
      console.error('status update failed:', err);
    }

    const newEntry: TicketHistoryEntry = {
      action: 'Status Change', oldStatus: null, newStatus: status,
      by: currentUserName, timestamp: new Date(),
    };
    const newCommentEntry: TicketComment | null = comment
      ? { author: currentUserName, type: 'internal', text: comment, timestamp: new Date() }
      : null;

    setActiveTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId !== id) return t;
        return {
          ...t,
          status,
          history:  [...t.history,  { ...newEntry, oldStatus: t.status }],
          comments: newCommentEntry ? [...t.comments, newCommentEntry] : t.comments,
        };
      }),
    );
    setOpenTicket((prev) => {
      if (!prev || prev.ticketId !== id) return prev;
      return {
        ...prev,
        status,
        history: [...prev.history, { ...newEntry, oldStatus: prev.status }],
        comments: newCommentEntry ? [...prev.comments, newCommentEntry] : prev.comments,
      };
    });
  }, [currentUserName]);

  const handleReassign = useCallback(async (id: string, users: ApiUser[], note: string) => {
    const primary = users[0];
    if (!primary) return;
    try {
      await apiFetch(`/tickets/id/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignee_id: primary.user_id, change_reason: note || undefined }),
      });
    } catch (err) {
      console.error('reassign failed:', err);
    }

    const names = users.map(apiUserName).join(', ');
    setActiveTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId !== id) return t;
        const newEntry: TicketHistoryEntry = {
          type: 'reassignment', action: 'Reassigned',
          oldStatus: t.status, newStatus: 'assigned',
          by: currentUserName, oldAssignee: t.assignee.name,
          newAssignee: names, detail: note || undefined, timestamp: new Date(),
        };
        return { ...t, assignee: toAssignee(primary), status: 'assigned', history: [...t.history, newEntry] };
      }),
    );
    setOpenTicket((prev) => {
      if (!prev || prev.ticketId !== id) return prev;
      return { ...prev, assignee: toAssignee(primary), status: 'assigned' };
    });
  }, [currentUserName]);

  const handleCommentPost = useCallback(async (id: string, text: string, type: 'internal' | 'public') => {
    try {
      await apiFetch(`/tickets/id/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text, is_internal: type === 'internal' }),
      });
    } catch (err) {
      console.error('comment post failed:', err);
    }
    const newComment: TicketComment = { author: currentUserName, type, text, timestamp: new Date() };
    setActiveTickets((prev) =>
      prev.map((t) => t.ticketId === id ? { ...t, comments: [...t.comments, newComment] } : t),
    );
    setOpenTicket((prev) => prev && prev.ticketId === id
      ? { ...prev, comments: [...prev.comments, newComment] }
      : prev,
    );
  }, [currentUserName]);

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

      {openTicket && (
        <TicketDetailDrawer
          ticket={openTicket}
          availableAssignees={assigneeList}
          onClose={() => setOpenTicket(null)}
          onStatusChange={handleStatusChange}
          onReassign={handleReassign}
          onCommentPost={handleCommentPost}
        />
      )}

      {showPerformance && (
        <PerformanceDashboard onClose={() => setShowPerformance(false)} userName={currentUserName} />
      )}
    </div>
  );
}