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
  MessageSquare,
  LayoutPanelLeft,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'draft' | 'new' | 'assigned' | 'solving' | 'solved' | 'failed' | 'renew';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  draft:    { label: 'Draft',    color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200',  icon: <Sparkles size={12} /> },
  new:      { label: 'New',      color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Bell size={12} /> },
  assigned: { label: 'Assigned', color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: <UserCheck size={12} /> },
  solving:  { label: 'Solving',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <Loader2 size={12} className="animate-spin" /> },
  solved:   { label: 'Solved',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={12} /> },
  failed:   { label: 'Failed',   color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     icon: <XCircle size={12} /> },
  renew:    { label: 'Renewed',  color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  icon: <RefreshCw size={12} /> },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-orange-400 to-orange-500',
  'from-blue-400 to-blue-500',
  'from-emerald-400 to-emerald-500',
  'from-purple-400 to-purple-500',
  'from-cyan-400 to-cyan-500',
  'from-rose-400 to-rose-500',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ person, size = 'md' }: { person: Person; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${avatarColor(person.name)} flex items-center justify-center shrink-0 shadow-sm`}>
      {person.avatar
        ? <img src={person.avatar} alt={person.name} className="w-full h-full object-cover rounded-full" />
        : <span className="text-white font-semibold">{person.fallback}</span>
      }
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.color} ${c.bg} ${c.border}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Comment bubble ───────────────────────────────────────────────────────────

function CommentBubble({ comment, isLast }: { comment: TicketComment; isLast: boolean }) {
  const isSystem = comment.author.name === 'IT Support Bot';
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar person={comment.author} size="sm" />
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-2" />}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${isSystem ? 'text-gray-400' : 'text-gray-800'}`}>
            {comment.author.name}
          </span>
          <span className="text-xs text-gray-400">
            {comment.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' · '}
            {comment.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed ${
          isSystem
            ? 'bg-gray-50 border border-gray-100 text-gray-400 italic'
            : 'bg-white border border-gray-200 shadow-sm text-gray-700'
        }`}>
          {comment.body}
        </div>
      </div>
    </div>
  );
}

// ─── People row ───────────────────────────────────────────────────────────────

function PersonRow({ person, label }: { person: Person; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      {person.name === 'Unassigned' ? (
        <span className="text-sm text-gray-300 italic pl-0.5">Unassigned</span>
      ) : (
        <div className="flex items-center gap-2">
          <Avatar person={person} size="sm" />
          <span className="text-sm text-gray-700">{person.name}</span>
        </div>
      )}
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
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Top bar ── */}
        <div className="shrink-0 h-14 border-b border-gray-100 flex items-center px-6 gap-3 bg-white">
          <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {ticket.ticketId}
          </span>
          <span className="text-gray-200">·</span>
          <span className="text-sm text-gray-500 truncate flex-1">
            {ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ════ LEFT — Ticket Detail ════ */}
          <div className="w-1/2 border-r border-gray-100 flex flex-col overflow-hidden">

            {/* Panel header */}
            <div className="shrink-0 px-6 py-3.5 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-blue-100 shadow-sm flex items-center justify-center">
                <LayoutPanelLeft size={14} className="text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Ticket Detail</span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              {/* Title + status */}
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{ticket.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={ticket.status as Status} />
                  {ticket.category && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                      {ticket.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Description */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</p>
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 leading-relaxed min-h-[80px]">
                  {ticket.description ?? <span className="italic text-gray-300">No description provided.</span>}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* People */}
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">People</p>
                <PersonRow person={ticket.creator} label="Creator" />
                <PersonRow person={ticket.assignee} label="Assignee" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Followers</span>
                  {ticket.followers.length === 0 ? (
                    <span className="text-sm text-gray-300 italic pl-0.5">No followers</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {ticket.followers.map((f) => (
                        <div key={f.name} className="flex items-center gap-2">
                          <Avatar person={f} size="sm" />
                          <span className="text-sm text-gray-700">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Details */}
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</p>
                {[
                  { label: 'Request ID', value: <span className="font-mono">{ticket.ticketId}</span> },
                  { label: 'Category',   value: ticket.category ?? '—' },
                  { label: 'Submitted',  value: ticket.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs text-gray-600">{value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ════ RIGHT — Comments ════ */}
          <div className="w-1/2 flex flex-col overflow-hidden">

            {/* Panel header */}
            <div className="shrink-0 px-6 py-3.5 bg-orange-50/70 border-b border-orange-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-orange-100 shadow-sm flex items-center justify-center">
                <MessageSquare size={14} className="text-orange-400" />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Comments
              </span>
              <span className="text-xs text-gray-400 ml-0.5">({localComments.length})</span>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {localComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                  <MessageSquare size={28} strokeWidth={1.5} />
                  <span className="text-sm">No comments yet.</span>
                </div>
              ) : (
                localComments.map((c, i) => (
                  <CommentBubble key={c.id} comment={c} isLast={i === localComments.length - 1} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box — pinned bottom */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="flex gap-3">
                <Avatar person={ticket.creator} size="sm" />
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    placeholder="Write a reply… (⌘+Enter to send)"
                    className="w-full px-3.5 py-2.5 pr-20 text-sm bg-white border border-gray-200 rounded-2xl rounded-tl-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all placeholder:text-gray-300"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || isSending}
                    className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 text-white text-xs font-medium rounded-xl transition-all"
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