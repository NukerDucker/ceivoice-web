'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, Clock,
  Sparkles, ChevronRight, Check, Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/notification';
import { apiFetch } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'draft_ready' | 'ticket_closed' | 'deadline';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  ticketId?: number;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

interface ApiDraft {
  ticket_id: number;
  title: string | null;
  created_at: string;
  category: { name: string } | null;
  ticket_requests: Array<{ request: { email: string } | null }>;
}

interface ApiTicket {
  ticket_id: number;
  title: string | null;
  status_id: number;
  status: { name: string } | null;
  deadline: string | null;
  assignee: { full_name: string | null; user_name: string | null } | null;
  updated_at: string;
}

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  badge: string;
  label: string;
}> = {
  draft_ready: {
    icon: <Sparkles size={14} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Draft Ready',
  },
  ticket_closed: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700 border-green-200',
    label: 'Ticket Closed',
  },
  deadline: {
    icon: <Clock size={14} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Deadline',
  },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',            label: 'All' },
  { id: 'draft_ready',   label: 'Draft Ready' },
  { id: 'ticket_closed', label: 'Ticket Closed' },
  { id: 'deadline',      label: 'Deadlines' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function buildNotifications(drafts: ApiDraft[], tickets: ApiTicket[]): Notification[] {
  const list: Notification[] = [];

  // Draft-ready: one notification per draft ticket
  for (const d of drafts) {
    const email = d.ticket_requests[0]?.request?.email ?? 'unknown';
    list.push({
      id: `draft-${d.ticket_id}`,
      type: 'draft_ready',
      title: 'New Draft Ready for Review',
      description: `AI has processed a request from ${email}. Draft ticket #${d.ticket_id}${d.title ? ` — "${d.title}"` : ''} is awaiting your review.`,
      timestamp: timeAgo(d.created_at),
      read: false,
      ticketId: d.ticket_id,
    });
  }

  const now = Date.now();

  for (const t of tickets) {
    const statusId = t.status_id;

    // Ticket closed: Solved (5) or Failed (6)
    if (statusId === 5 || statusId === 6) {
      const label  = statusId === 5 ? 'Solved' : 'Failed';
      const assigneeName = t.assignee?.full_name ?? t.assignee?.user_name ?? 'Support Team';
      list.push({
        id: `closed-${t.ticket_id}`,
        type: 'ticket_closed',
        title: `Ticket ${label} — #${t.ticket_id}`,
        description: `Ticket #${t.ticket_id}${t.title ? ` "${t.title}"` : ''} has been marked as ${label} by ${assigneeName}.`,
        timestamp: timeAgo(t.updated_at),
        read: true,
        ticketId: t.ticket_id,
      });
    }

    // Deadline: upcoming (within 7 days) or already passed, for active tickets
    if (t.deadline && statusId !== 5 && statusId !== 6) {
      const deadline = new Date(t.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - now) / 86400000);

      if (daysUntil <= 7) {
        const isPast = daysUntil < 0;
        list.push({
          id: `deadline-${t.ticket_id}`,
          type: 'deadline',
          title: isPast
            ? `Deadline Passed — #${t.ticket_id}`
            : `Deadline in ${daysUntil}d — #${t.ticket_id}`,
          description: isPast
            ? `Ticket #${t.ticket_id}${t.title ? ` "${t.title}"` : ''} passed its deadline ${Math.abs(daysUntil)} day(s) ago and is still ${t.status?.name ?? 'active'}.`
            : `Ticket #${t.ticket_id}${t.title ? ` "${t.title}"` : ''} is due in ${daysUntil} day(s) and is ${t.status?.name ?? 'active'}.`,
          timestamp: timeAgo(t.updated_at),
          read: isPast,
          ticketId: t.ticket_id,
        });
      }
    }
  }

  // Sort: unread first, then by id
  return list.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onRead,
  onDelete,
  onView,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (ticketId: number) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type];

  return (
    <div className={`flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all group ${
      notification.read
        ? 'bg-white border-gray-100'
        : 'bg-blue-50/30 border-blue-100'
    }`}>
      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
        {cfg.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {!notification.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          {notification.ticketId && (
            <span className="text-[10px] text-gray-400 font-mono">#{notification.ticketId}</span>
          )}
          <span className="text-[10px] text-gray-400 ml-auto">{notification.timestamp}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 mb-0.5">{notification.title}</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">{notification.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {!notification.read && (
          <button
            onClick={() => onRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Check size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title="Dismiss"
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
        {notification.ticketId && (
          <button
            onClick={() => onView(notification.ticketId!)}
            title="View ticket"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter]   = useState<FilterId>('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [drafts, tickets] = await Promise.all([
          apiFetch<ApiDraft[]>('/admin/drafts'),
          apiFetch<ApiTicket[]>('/admin/tickets'),
        ]);
        console.debug('[Notifications] drafts:', drafts.length, 'tickets:', tickets.length);
        setNotifications(buildNotifications(drafts, tickets));
      } catch (err) {
        console.error('[Notifications] fetch error:', err);
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) =>
    activeFilter === 'all' ? true : n.type === activeFilter
  );

  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));

  const dismiss = (id: string) =>
    setNotifications((p) => p.filter((n) => n.id !== id));

  const viewTicket = (ticketId: number) =>
    router.push(`/admin/review-ticket?id=${ticketId}`);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <Header />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white">
            <Bell size={14} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Notifications</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Check size={12} /> Mark all as read
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-gray-100 shrink-0">
        {FILTERS.map((f) => {
          const count = f.id === 'all'
            ? notifications.length
            : notifications.filter((n) => n.type === f.id).length;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {f.label}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <p className="text-xs font-semibold">Loading notifications…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-red-400">
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <Bell size={28} className="mb-2" />
            <p className="text-xs font-semibold">No notifications</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-3xl">
            {filtered.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={markRead}
                onDelete={dismiss}
                onView={viewTicket}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
