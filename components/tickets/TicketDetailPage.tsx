'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, User, Briefcase, Tag, Calendar,
  ChevronDown, Lock, Globe, Send, RotateCcw,
  CheckCircle2, XCircle, Loader2, Edit2, Check, X,
  History, Users, MessageSquare,
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type { ApiHistoryEntry } from '@/types/api';

// ─── Types (matching your Prisma schema) ─────────────────────────────────────

type TicketStatus = 'draft' | 'new' | 'assigned' | 'solving' | 'solved' | 'failed' | 'renew' | 'reassigned';
type CommentVisibility = 'PUBLIC' | 'PRIVATE';
type UserRole = 'admin' | 'assignee' | 'user';

interface TicketAssignee {
  user_id:   string;
  full_name: string | null;
  user_name: string | null;
  email:     string;
}

interface TicketComment {
  comment_id: number;
  content:    string;
  /** "PUBLIC" = visible to all. "PRIVATE" = internal staff only. */
  visibility: 'PUBLIC' | 'PRIVATE';
  created_at: string;
  user: {
    user_id:   string;
    full_name: string | null;
    user_name: string | null;
    role:      string;
  };
}

interface StatusHistoryEntry {
  history_id:    number;
  changed_at:    string;
  change_reason: string | null;
  old_status:    { name: string } | null;
  new_status:    { name: string } | null;
  changed_by:    { user_id: string; full_name: string | null; user_name: string | null; email: string } | null;
}

interface AssignmentHistoryEntry {
  assignment_id: number;
  changed_at:    string;
  change_reason: string | null;
  old_assignee:  { user_id: string; full_name: string | null; user_name: string | null; email: string } | null;
  new_assignee:  { user_id: string; full_name: string | null; user_name: string | null; email: string } | null;
  changed_by:    { user_id: string; full_name: string | null; user_name: string | null; email: string };
}

interface TicketDetail {
  ticket_id:         number;
  title:             string;
  summary:           string;
  suggested_solution: string | null;
  priority:          string;
  created_at:        string;
  deadline:          string | null;
  resolved_at:       string | null;
  status:            { status_id: number; name: string } | null;
  category:          { category_id: number; name: string } | null;
  creator:           TicketAssignee | null;
  assignee:          TicketAssignee | null;
  followers:         { user: TicketAssignee }[];
  comments:          TicketComment[];
  status_history:    StatusHistoryEntry[];
  assignment_history: AssignmentHistoryEntry[];
  ticket_requests:   { request: { request_id: number; email: string; message: string } }[];
}

interface CurrentUser {
  user_id:   string;
  full_name: string | null;
  role:      UserRole; // ✅ CHANGED: was `string`, now `UserRole`
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, {
  label: string; color: string; bg: string; border: string; dot: string; borderLeft: string;
}> = {
  draft:      { label: 'Draft',      color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-300',   dot: 'bg-gray-400',   borderLeft: 'border-l-gray-400'    },
  new:        { label: 'New',        color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-400',   dot: 'bg-blue-500',   borderLeft: 'border-l-blue-400'    },
  assigned:   { label: 'Assigned',   color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-400', dot: 'bg-indigo-500', borderLeft: 'border-l-indigo-400'  },
  solving:    { label: 'Solving',    color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-400', dot: 'bg-yellow-500', borderLeft: 'border-l-yellow-400'  },
  solved:     { label: 'Solved',     color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-500',  dot: 'bg-green-500',  borderLeft: 'border-l-green-500'   },
  failed:     { label: 'Failed',     color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-400',    dot: 'bg-red-500',    borderLeft: 'border-l-red-500'     },
  renew:      { label: 'Renew',      color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-400', dot: 'bg-orange-500', borderLeft: 'border-l-orange-400'  },
  reassigned: { label: 'Reassigned', color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-400', dot: 'bg-purple-500', borderLeft: 'border-l-purple-400'  },
};

// Maps your DB status names to local type
const STATUS_NAME_MAP: Record<string, TicketStatus> = {
  Draft: 'draft', New: 'new', Assigned: 'assigned',
  Solving: 'solving', Solved: 'solved', Failed: 'failed',
  Renew: 'renew', Reassigned: 'reassigned',
};

// Maps local type back to API string
const STATUS_TO_API: Record<TicketStatus, string> = {
  draft: 'Draft', new: 'New', assigned: 'Assigned',
  solving: 'Solving', solved: 'Solved', failed: 'Failed',
  renew: 'Renew', reassigned: 'Reassigned',
};

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  draft:      ['new'],
  new:        ['assigned', 'reassigned', 'solving', 'solved', 'failed'],
  assigned:   ['reassigned', 'solving', 'solved', 'failed'],
  solving:    ['solved', 'failed'],
  solved:     ['renew'],
  failed:     ['reassigned', 'renew'],
  renew:      ['reassigned', 'assigned'],
  reassigned: ['assigned', 'solving'],
};

// Transitions available to assignee role only (can only reassign)
const ASSIGNEE_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  draft:      [],
  new:        ['reassigned'],
  assigned:   ['reassigned'],
  solving:    [],
  solved:     [],
  failed:     ['reassigned'],
  renew:      ['reassigned'],
  reassigned: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(u: { full_name?: string | null; user_name?: string | null } | null): string {
  if (!u) return 'Unknown';
  return u.full_name || u.user_name || 'Unknown';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function initials(u: { full_name?: string | null; user_name?: string | null } | null): string {
  const name = u?.full_name || u?.user_name || '?';
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'from-violet-400 to-violet-600', 'from-blue-400 to-blue-600',
  'from-teal-400 to-teal-600',     'from-orange-400 to-orange-500',
  'from-pink-400 to-pink-600',     'from-indigo-400 to-indigo-600',
];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'sm' }: {
  user: { user_id: string; full_name?: string | null; user_name?: string | null } | null;
  size?: 'sm' | 'md';
}) {
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-[10px]';
  const id = user?.user_id ?? '0';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${avatarColor(id)} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white font-bold">{initials(user)}</span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-full border ${c.bg} ${c.color} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label.toUpperCase()}
    </span>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ current, role, onChangeStatus, onReassign }: {
  current: TicketStatus;
  role: UserRole;
  onChangeStatus: (s: TicketStatus) => void;
  onReassign: () => void;
}) {
  const [open, setOpen]                     = useState(false);
  const [requireComment, setRequireComment] = useState<TicketStatus | null>(null);
  const transitions = role === 'assignee'
    ? (ASSIGNEE_TRANSITIONS[current] ?? [])
    : (VALID_TRANSITIONS[current] ?? []);
  const canChange   = role === 'admin' || role === 'assignee';

  if (!canChange) return <StatusBadge status={current} />;

  function handleSelect(s: TicketStatus) {
    setOpen(false);
    if (s === 'reassigned') {
      // Open reassign modal — status will update after person is picked
      onReassign();
    } else if (s === 'solved' || s === 'failed') {
      setRequireComment(s);
    } else {
      onChangeStatus(s);
    }
    setOpen(false);
  }

  return (
    <>
      <div className="relative inline-flex items-center">
        <div className={`flex items-center rounded-full border ${STATUS_CONFIG[current].border} overflow-hidden select-none`}>
          <span className={`text-sm font-bold px-3 py-1.5 ${STATUS_CONFIG[current].color} whitespace-nowrap`}>
            {STATUS_CONFIG[current].label.toUpperCase()}
          </span>
          {transitions.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              className={`px-2 py-1.5 border-l ${STATUS_CONFIG[current].border} ${STATUS_CONFIG[current].color} hover:opacity-70 transition-opacity`}
            >
              <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        {open && transitions.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-36">
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  <span className={`font-bold ${STATUS_CONFIG[s].color}`}>{STATUS_CONFIG[s].label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {requireComment && (
        <ResolutionCommentModal
          status={requireComment}
          onConfirm={(comment) => { onChangeStatus(requireComment); setRequireComment(null); }}
          onCancel={() => setRequireComment(null)}
        />
      )}
    </>
  );
}

// ─── Resolution Comment Modal ─────────────────────────────────────────────────

function ResolutionCommentModal({ status, onConfirm, onCancel }: {
  status: TicketStatus;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const isSolved = status === 'solved';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          {isSolved
            ? <CheckCircle2 size={20} className="text-green-500" />
            : <XCircle size={20} className="text-red-500" />}
          <h3 className="text-sm font-bold text-gray-800">
            Mark as {isSolved ? 'Solved' : 'Failed'}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          A resolution comment is required before changing status to <strong>{isSolved ? 'Solved' : 'Failed'}</strong>.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={isSolved ? 'Describe how the issue was resolved…' : 'Explain why this ticket failed…'}
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-300 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            disabled={!text.trim()}
            onClick={() => onConfirm(text)}
            className={`px-4 py-2 text-xs font-bold rounded-full text-white transition-colors ${isSolved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-40`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────

function ReassignModal({ currentAssigneeId, onConfirm, onCancel }: {
  currentAssigneeId: string | null;
  onConfirm: (userId: string) => void;
  onCancel: () => void;
}) {
  const [assignees, setAssignees] = useState<TicketAssignee[]>([]);
  const [selected,  setSelected]  = useState<string | null>(currentAssigneeId);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    apiFetch<TicketAssignee[]>('/admin/assignees')
      .then((data) => { setAssignees(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm mx-4 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Reassign Ticket</h3>
        <p className="text-xs text-gray-400 mb-4">Select an assignee.</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-1">
            {assignees.map((a) => {
              const sel = selected === a.user_id;
              return (
                <button
                  key={a.user_id}
                  onClick={() => setSelected(a.user_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${sel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <Avatar user={a} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{displayName(a)}</p>
                    <p className="text-xs text-gray-400 truncate">{a.email}</p>
                  </div>
                  {sel && <Check size={13} className="text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            className="px-4 py-2 text-xs font-bold rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deadline Edit Modal ──────────────────────────────────────────────────────

function DeadlineEditModal({ current, onConfirm, onCancel }: {
  current: string | null;
  onConfirm: (iso: string) => void;
  onCancel: () => void;
}) {
  // Convert ISO to local datetime-local format
  const toLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [value, setValue] = useState(toLocal(current));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={18} className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-800">Edit Deadline</h3>
        </div>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-300"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            disabled={!value}
            onClick={() => value && onConfirm(new Date(value).toISOString())}
            className="px-4 py-2 text-xs font-bold rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Bubble ───────────────────────────────────────────────────────────

function CommentBubble({ comment, viewerRole }: { comment: TicketComment; viewerRole: UserRole }) {
  const isInternal = comment.visibility === 'PRIVATE';
  if (isInternal && viewerRole === 'user') return null;

  return (
    <div className={`rounded-2xl px-4 py-3 ${isInternal ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">{displayName(comment.user)}</span>          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
            comment.user.role === 'admin'    ? 'bg-violet-100 text-violet-600' :
            comment.user.role === 'assignee' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-500'
          }`}>{comment.user.role}</span>
          {isInternal
            ? <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase"><Lock size={8} /> Internal</span>
            : <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase"><Globe size={8} /> Public</span>
          }
        </div>
        <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
    </div>
  );
}

// ─── Comment Composer ─────────────────────────────────────────────────────────

function CommentComposer({ role, onSubmit }: {
  role: UserRole;
  onSubmit: (content: string, visibility: CommentVisibility) => Promise<void>;
}) {
  const [content,    setContent]    = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit(content, visibility);
    setContent('');
    setSubmitting(false);
  }

  return (
    <div className={`rounded-2xl border p-4 ${visibility === 'PRIVATE' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={visibility === 'PRIVATE' ? 'Add an internal note (only visible to staff)…' : 'Write a public reply…'}
        className="w-full text-xs bg-transparent outline-none resize-none text-gray-700 placeholder:text-gray-300"
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 flex-wrap gap-2">
        {(role === 'admin' || role === 'assignee') ? (
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            {(['PUBLIC', 'PRIVATE'] as CommentVisibility[]).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`flex items-center gap-1 text-[10px] font-semibold px-3 py-1 rounded-full transition-all ${
                  visibility === v
                    ? (v === 'PRIVATE' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 shadow-sm')
                    : 'text-gray-400'
                }`}
              >
                {v === 'PRIVATE' ? <Lock size={9} /> : <Globe size={9} />}
                {v === 'PRIVATE' ? 'Internal' : 'Public'}
              </button>
            ))}
          </div>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><Globe size={10} /> Public reply</span>
        )}
        <button
          disabled={!content.trim() || submitting}
          onClick={handleSubmit}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
          Send
        </button>
      </div>
    </div>
  );
}

// ─── History Log ──────────────────────────────────────────────────────────────

function HistoryLog({ statusHistory, assignmentHistory }: {
  statusHistory:     StatusHistoryEntry[];
  assignmentHistory: AssignmentHistoryEntry[];
}) {
  type Entry = { date: string; description: string; by: string };

  const entries: Entry[] = [
    ...statusHistory.map((e) => ({
      date: e.changed_at,
      description: `Status changed from ${e.old_status?.name ?? 'N/A'} → ${e.new_status?.name ?? 'N/A'}${e.change_reason ? `: ${e.change_reason}` : ''}`,
      by: displayName(e.changed_by),
    })),
    ...assignmentHistory.map((e) => ({
      date: e.changed_at,
      description: `Reassigned from ${displayName(e.old_assignee)} → ${displayName(e.new_assignee)}${e.change_reason ? `: ${e.change_reason}` : ''}`,
      by: displayName(e.changed_by),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-xs text-gray-300 italic text-center py-4">No history yet.</p>
      )}
      {entries.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <History size={10} className="text-gray-400" />
            </div>
            {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-sm text-gray-700">{e.description}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{e.by} · {timeAgo(e.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inline Edit Field ────────────────────────────────────────────────────────

function InlineEditField({ label, value, onSave, multiline = false }: {
  label: string; value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [saving,  setSaving]  = useState(false);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        {!editing && (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors">
            <Edit2 size={9} /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          {multiline ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300 resize-none" />
          ) : (
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300" />
          )}
          <div className="flex gap-1.5">
            <button disabled={saving} onClick={save}
              className="flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors">
              {saving ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />} Save
            </button>
            <button onClick={() => setEditing(false)} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">
          {value || <span className="text-gray-300 italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const router = useRouter();

  const [ticket,          setTicket]          = useState<TicketDetail | null>(null);
  const [currentUser,     setCurrentUser]     = useState<CurrentUser | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [showReassign,    setShowReassign]    = useState(false);
  const [showDeadline,    setShowDeadline]    = useState(false);
  const [activeTab,       setActiveTab]       = useState<'comments' | 'history'>('comments');

  useEffect(() => {
    (async () => {
      try {
        const [t, comments, historyRes] = await Promise.all([
          apiFetch<TicketDetail>(`/tickets/id/${ticketId}`),
          apiFetch<TicketComment[]>(`/tickets/id/${ticketId}/comments`),
          apiFetch<{ history: ApiHistoryEntry[] }>(`/tickets/id/${ticketId}/history`),
        ]);
        setTicket({ ...t, comments, status_history: historyRes.history
          .filter((h) => h.type === 'status_change')
          .map((h, i) => ({
            history_id: i,
            changed_at: h.timestamp,
            change_reason: h.change_reason ?? null,
            old_status: h.old_status ? { name: h.old_status } : null,
            new_status: h.new_status ? { name: h.new_status } : null,
            changed_by: h.changed_by ? { user_id: h.changed_by.user_id, full_name: h.changed_by.name, user_name: null, email: '' } : null,
          })),
          assignment_history: historyRes.history
          .filter((h) => h.type === 'assignment_change')
          .map((h, i) => ({
            assignment_id: i,
            changed_at: h.timestamp,
            change_reason: h.change_reason ?? null,
            old_assignee: h.old_assignee ? { user_id: h.old_assignee.user_id, full_name: h.old_assignee.name, user_name: null, email: '' } : null,
            new_assignee: h.new_assignee ? { user_id: h.new_assignee.user_id, full_name: h.new_assignee.name, user_name: null, email: '' } : null,
            changed_by: h.changed_by ? { user_id: h.changed_by.user_id, full_name: h.changed_by.name, user_name: null, email: '' } : { user_id: '', full_name: 'System', user_name: null, email: '' },
          })),
        });
        // Read role directly from JWT claims (app_role is injected by Supabase hook)
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? '';
        const claims = token ? JSON.parse(atob(token.split('.')[1])) : {};
        const role = (claims.app_role ?? 'user').toLowerCase() as UserRole;
        const user = session?.user;
        setCurrentUser({ user_id: user?.id ?? '', full_name: user?.user_metadata?.full_name ?? null, role });
      } catch (e) {
        setError('Failed to load ticket.');
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const role: UserRole = (currentUser?.role?.toLowerCase() as UserRole) ?? 'user';
  const currentStatus: TicketStatus = ticket?.status
    ? (STATUS_NAME_MAP[ticket.status.name] ?? 'draft')
    : 'draft';

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleStatusChange(status: TicketStatus) {
    if (!ticket) return;
    try {
      await apiFetch(`/tickets/id/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: STATUS_TO_API[status] }),
      });
      setTicket((t) => t ? {
        ...t,
        status: { status_id: t.status?.status_id ?? 0, name: STATUS_TO_API[status] },
      } : t);
    } catch {}
  }

  async function handleReassign(userId: string) {
    if (!ticket) return;
    try {
      // Assign the person
      await apiFetch(`/tickets/id/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignee_id: userId }),
      });
      // Set status back to New after reassigning
      await apiFetch(`/tickets/id/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: 'New' }),
      });
      setShowReassign(false);
      const updated = await apiFetch<TicketDetail>(`/tickets/id/${ticketId}`);
      setTicket((prev) => prev ? { ...updated, comments: prev.comments, status_history: prev.status_history, assignment_history: prev.assignment_history } : updated);
    } catch {}
  }

  async function handleDeadlineSave(iso: string) {
    if (!ticket) return;
    try {
      await apiFetch(`/tickets/id/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ deadline: iso }),
      });
      setTicket((t) => t ? { ...t, deadline: iso } : t);
      setShowDeadline(false);
    } catch {}
  }

  async function handleCommentSubmit(content: string, visibility: CommentVisibility) {
    if (!ticket) return;
    try {
      const comment = await apiFetch<TicketComment>(`/tickets/id/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, visibility }),
      });
      setTicket((t) => t ? { ...t, comments: [...t.comments, comment] } : t);
    } catch {}
  }

  async function handleFieldSave(field: string, value: string) {
    if (!ticket) return;
    try {
      await apiFetch(`/tickets/id/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value }),
      });
      setTicket((t) => t ? { ...t, [field]: value } : t);
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  if (error || !ticket || !currentUser) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <p className="text-sm text-red-400">{error ?? 'Ticket not found.'}</p>
    </div>
  );

  const canEdit = role === 'admin';
  const canAct  = role === 'admin' || role === 'assignee';
  const visibleComments = ticket.comments.filter(
    (c) => role !== 'user' || c.visibility === 'PUBLIC'
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 px-4 sm:px-8 py-4 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-gray-300 shrink-0">#{ticket.ticket_id}</span>
          <h1 className="text-base font-bold text-gray-800 truncate">{ticket.title}</h1>
        </div>
        <div className="shrink-0">
          <StatusDropdown current={currentStatus} role={role} onChangeStatus={handleStatusChange} onReassign={() => setShowReassign(true)} />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title + meta card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              {canEdit ? (
                <InlineEditField label="Title" value={ticket.title} onSave={(v) => handleFieldSave('title', v)} />
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Title</p>
                  <p className="text-sm font-semibold text-gray-800">{ticket.title}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Category</p>
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    {ticket.category?.name ?? '—'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Priority</p>
                  <span className="text-sm text-gray-600">{ticket.priority}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Clock size={9} /> Created</p>
                  <span className="text-sm text-gray-600">{formatDate(ticket.created_at)}</span>
                </div>
                {/* ── Deadline with edit button ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"><Calendar size={9} /> Deadline</p>
                    {canEdit && (
                      <button
                        onClick={() => setShowDeadline(true)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
                      >
                        <Edit2 size={9} /> Edit
                      </button>
                    )}
                  </div>
                  {ticket.deadline
                    ? <span className="text-sm text-gray-600">{formatDate(ticket.deadline)}</span>
                    : <span className="text-sm text-gray-300 italic">Not set</span>}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              {canEdit ? (
                <InlineEditField label="Summary" value={ticket.summary} onSave={(v) => handleFieldSave('summary', v)} multiline />
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{ticket.summary || <span className="text-gray-300 italic">No summary.</span>}</p>
                </div>
              )}
            </div>

            {/* Suggested solution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              {canEdit ? (
                <InlineEditField label="Suggested Solution" value={ticket.suggested_solution ?? ''} onSave={(v) => handleFieldSave('suggested_solution', v)} multiline />
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Suggested Solution</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {ticket.suggested_solution || <span className="text-gray-300 italic">No suggested solution.</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Original requests */}
            {ticket.ticket_requests.length > 0 && (
              <details className="bg-gray-50 rounded-2xl border border-gray-100 p-4 group">
                <summary className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer select-none list-none flex items-center gap-1.5">
                  <MessageSquare size={10} />
                  Original Request{ticket.ticket_requests.length > 1 ? `s (${ticket.ticket_requests.length})` : ''}
                  <ChevronDown size={10} className="ml-auto group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3 space-y-3">
                  {ticket.ticket_requests.map(({ request }) => (
                    <div key={request.request_id} className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-[10px] text-gray-400 mb-1">{request.email}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{request.message}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Comments / History tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(['comments', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                      activeTab === tab ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab === 'comments' ? `Comments (${visibleComments.length})` : 'History'}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === 'comments' ? (
                  <div className="space-y-3">
                    {visibleComments.length === 0 && (
                      <p className="text-xs text-gray-300 italic text-center py-4">No comments yet.</p>
                    )}
                    {visibleComments.map((c) => (
                      <CommentBubble key={c.comment_id} comment={c} viewerRole={role} />
                    ))}
                    <div className="pt-2">
                      <CommentComposer role={role} onSubmit={handleCommentSubmit} />
                    </div>
                  </div>
                ) : (
                  <HistoryLog
                    statusHistory={ticket.status_history}
                    assignmentHistory={ticket.assignment_history}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">

            {/* Actions */}
            {canAct && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</p>
                <button
                  onClick={() => setShowReassign(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl py-2 hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  <RotateCcw size={12} /> Reassign
                </button>
              </div>
            )}

            {/* People */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={10} /> People
              </p>

              {/* Creator */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><User size={9} /> Creator</p>
                {ticket.creator ? (
                  <div className="flex items-center gap-2">
                    <Avatar user={ticket.creator} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{displayName(ticket.creator)}</p>
                      <p className="text-xs text-gray-400 truncate">{ticket.creator.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-300 italic">No creator</p>
                )}
              </div>

              {/* Assignee */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"><Briefcase size={9} /> Assignee</p>
                  {canEdit && (
                    <button
                      onClick={() => setShowReassign(true)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
                    >
                      <Edit2 size={9} /> Edit
                    </button>
                  )}
                </div>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar user={ticket.assignee} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{displayName(ticket.assignee)}</p>
                      <p className="text-xs text-gray-400 truncate">{ticket.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReassign(true)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 italic transition-colors"
                  >
                    + Assign someone
                  </button>
                )}
              </div>

              {/* Followers */}
              {ticket.followers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Tag size={9} /> Followers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.followers.map(({ user: f }) => (
                      <div key={f.user_id} title={`${displayName(f)} (${f.email})`}>
                        <Avatar user={f} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ticket details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</p>
              <div className="space-y-2">
                {[
                  { label: 'Ticket ID', value: `#${ticket.ticket_id}` },
                  { label: 'Category',  value: ticket.category?.name ?? '—' },
                  { label: 'Priority',  value: ticket.priority },
                  { label: 'Created',   value: new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  ...(ticket.deadline ? [{ label: 'Deadline', value: new Date(ticket.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
                  ...(ticket.resolved_at ? [{ label: 'Resolved', value: new Date(ticket.resolved_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {showReassign && (
        <ReassignModal
          currentAssigneeId={ticket.assignee?.user_id ?? null}
          onConfirm={handleReassign}
          onCancel={() => setShowReassign(false)}
        />
      )}

      {showDeadline && (
        <DeadlineEditModal
          current={ticket.deadline}
          onConfirm={handleDeadlineSave}
          onCancel={() => setShowDeadline(false)}
        />
      )}
    </div>
  );
}