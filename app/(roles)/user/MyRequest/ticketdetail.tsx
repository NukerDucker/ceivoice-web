'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MOCK_USER_TICKETS,
  MOCK_COMMENTS,
  TicketComment,
  Person,
} from '@/lib/constants';
import {
  X,
  Sparkles,
  Bell,
  UserCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'draft' | 'new' | 'assigned' | 'solving' | 'solved' | 'failed' | 'renew';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }
> = {
  draft:    { label: 'Draft',    color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200',  dot: 'bg-purple-400',  icon: <Sparkles size={11} /> },
  new:      { label: 'New',      color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-400',    icon: <Bell size={11} /> },
  assigned: { label: 'Assigned', color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    dot: 'bg-cyan-400',    icon: <UserCheck size={11} /> },
  solving:  { label: 'Solving',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   icon: <Loader2 size={11} className="animate-spin" /> },
  solved:   { label: 'Solved',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400', icon: <CheckCircle2 size={11} /> },
  failed:   { label: 'Failed',   color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-400',     icon: <XCircle size={11} /> },
  renew:    { label: 'Renewed',  color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-400',  icon: <RefreshCw size={11} /> },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-orange-200 to-orange-300',
  'from-blue-200 to-blue-300',
  'from-emerald-200 to-emerald-300',
  'from-purple-200 to-purple-300',
  'from-cyan-200 to-cyan-300',
  'from-rose-200 to-rose-300',
  'from-yellow-200 to-yellow-300',
  'from-pink-200 to-pink-300',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ person, size = 'md' }: { person: Person; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${avatarColor(person.name)} flex items-center justify-center shrink-0`}>
      {person.avatar
        ? <img src={person.avatar} alt={person.name} className="w-full h-full object-cover rounded-full" />
        : <span className="text-gray-600 font-semibold">{person.fallback}</span>
      }
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${c.color} ${c.bg} ${c.border}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Comment ──────────────────────────────────────────────────────────────────

function Comment({ comment, isLast }: { comment: TicketComment; isLast: boolean }) {
  const isSystem = comment.author.name === 'IT Support Bot';
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar person={comment.author} size="sm" />
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-2" />}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-sm font-semibold ${isSystem ? 'text-gray-400' : 'text-gray-900'}`}>
            {comment.author.name}
          </span>
          <span className="text-xs text-gray-400">
            {comment.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            {' '}
            {comment.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${isSystem ? 'text-gray-400 italic' : 'text-gray-600'}`}>
          {comment.body}
        </p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketDetailModal({ ticketId, onClose }: TicketDetailModalProps) {
  const ticket = MOCK_USER_TICKETS.find((t) => t.ticketId === ticketId);
  const initialComments = MOCK_COMMENTS.filter(
    (c) => c.ticketId === ticketId && !c.isInternal
  );

  const [localComments, setLocalComments] = useState<TicketComment[]>(initialComments);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalComments(MOCK_COMMENTS.filter((c) => c.ticketId === ticketId && !c.isInternal));
    setReplyText('');
  }, [ticketId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ticketId || !ticket) return null;

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsSending(true);
    setTimeout(() => {
      setLocalComments((prev) => [...prev, {
        id: `local-${Date.now()}`,
        ticketId,
        author: ticket.creator,
        body: trimmed,
        createdAt: new Date(),
        isInternal: false,
      }]);
      setReplyText('');
      setIsSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ height: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="shrink-0 px-8 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* ID + category row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-gray-400">{ticket.ticketId}</span>
                {ticket.category && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{ticket.category}</span>
                  </>
                )}
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{ticket.title}</h1>
            </div>
            <div className="flex items-center gap-3 shrink-0 mt-1">
              <StatusBadge status={ticket.status as Status} />
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ════ LEFT ════ */}
          <div className="w-[45%] border-r border-gray-100 overflow-y-auto px-8 py-6 flex flex-col gap-7">

            {/* Description */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {ticket.description ?? <span className="italic text-gray-300">No description provided.</span>}
              </p>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* People */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">People</p>
              <div className="flex flex-col gap-4">

                {/* Creator */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400">Creator</span>
                  <div className="flex items-center gap-2.5">
                    <Avatar person={ticket.creator} size="sm" />
                    <span className="text-sm font-medium text-gray-800">{ticket.creator.name}</span>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400">Assignee</span>
                  {ticket.assignee.name === 'Unassigned' ? (
                    <span className="text-sm text-gray-300 italic">Unassigned</span>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Avatar person={ticket.assignee} size="sm" />
                      <span className="text-sm font-medium text-gray-800">{ticket.assignee.name}</span>
                    </div>
                  )}
                </div>

                {/* Followers */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400">Followers</span>
                  {ticket.followers.length === 0 ? (
                    <span className="text-sm text-gray-300 italic">None</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {ticket.followers.map((f) => (
                        <div key={f.name} title={f.name}>
                          <Avatar person={f} size="sm" />
                        </div>
                      ))}
                      <span className="text-sm text-gray-500 ml-1">
                        {ticket.followers.map(f => f.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Details */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Details</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Request ID', value: <span className="font-mono text-gray-700">{ticket.ticketId}</span> },
                  { label: 'Category',   value: <span className="text-gray-700">{ticket.category ?? '—'}</span> },
                  { label: 'Submitted',  value: <span className="text-gray-700">{ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span> },
                  { label: 'Status',     value: <StatusBadge status={ticket.status as Status} /> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ════ RIGHT — Comments ════ */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Comments label */}
            <div className="shrink-0 px-8 pt-6 pb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Comments
              </p>
              <span className="text-xs text-gray-400">{localComments.length}</span>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-8 pb-4">
              {localComments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-300">No comments yet.</p>
                </div>
              ) : (
                localComments.map((c, i) => (
                  <Comment key={c.id} comment={c} isLast={i === localComments.length - 1} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="shrink-0 border-t border-gray-100 px-8 py-5">
              <div className="flex gap-3 items-start">
                <Avatar person={ticket.creator} size="sm" />
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    placeholder="Reply… (⌘+Enter to send)"
                    className="w-full px-4 py-3 pr-20 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all placeholder:text-gray-300"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || isSending}
                    className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 text-white text-xs font-medium rounded-lg transition-all"
                  >
                    {isSending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                    Send
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}