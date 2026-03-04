'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, Clock, MessageSquare,
  UserCheck, UserPlus, ChevronRight, Check, Trash2,
  XCircle, RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/notification';
import { apiFetch } from '@/lib/api-client';
import type { ApiTicket } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'ticket_assigned' | 'reassignment' | 'new_comment' | 'deadline' | 'status_update' | 'ticket_closed' | 'ticket_renewed';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  ticketId?: string;
}

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

function buildNotifications(active: ApiTicket[], resolved: ApiTicket[]): Notification[] {
  const list: Notification[] = [];
  const now = Date.now();

  for (const t of active) {
    const titleStr   = t.title ? `"${t.title}"` : `#${t.ticket_id}`;
    const statusName = t.status?.name?.toLowerCase() ?? 'assigned';

    if (t.deadline) {
      const daysUntil = Math.ceil((new Date(t.deadline).getTime() - now) / 86400000);
      if (daysUntil <= 7) {
        const isPast = daysUntil < 0;
        list.push({
          id: `deadline-${t.ticket_id}`,
          type: 'deadline',
          title: isPast
            ? `Deadline Passed — #${t.ticket_id}`
            : `Deadline in ${daysUntil}d — #${t.ticket_id}`,
          description: isPast
            ? `Ticket #${t.ticket_id} ${titleStr} passed its deadline ${Math.abs(daysUntil)} day(s) ago and is still ${t.status?.name ?? 'active'}. Please update the status immediately.`
            : `Ticket #${t.ticket_id} ${titleStr} is due in ${daysUntil} day(s). Current status: ${t.status?.name ?? 'active'}.`,
          timestamp: timeAgo(t.updated_at),
          read: isPast,
          ticketId: String(t.ticket_id),
        });
      }
    }

    if (statusName === 'solving') {
      list.push({
        id: `solving-${t.ticket_id}`,
        type: 'status_update',
        title: `In Progress — #${t.ticket_id}`,
        description: `You are actively working on ticket #${t.ticket_id} ${titleStr}.`,
        timestamp: timeAgo(t.updated_at),
        read: true,
        ticketId: String(t.ticket_id),
      });
    } else if (statusName === 'assigned') {
      list.push({
        id: `assigned-${t.ticket_id}`,
        type: 'ticket_assigned',
        title: `Ticket Assigned — #${t.ticket_id}`,
        description: `Ticket #${t.ticket_id} ${titleStr} has been assigned to you. Please review and begin resolution.`,
        timestamp: timeAgo(t.updated_at),
        read: false,
        ticketId: String(t.ticket_id),
      });
    }
  }

  for (const t of resolved) {
    const titleStr   = t.title ? `"${t.title}"` : `#${t.ticket_id}`;
    const statusName = t.status?.name?.toLowerCase() ?? 'solved';

    if (statusName === 'renew') {
      list.push({
        id: `renewed-${t.ticket_id}`,
        type: 'ticket_renewed',
        title: `Ticket Renewed — #${t.ticket_id}`,
        description: `Ticket #${t.ticket_id} ${titleStr} has been reopened and reassigned to you. Please review the updated request.`,
        timestamp: timeAgo(t.updated_at),
        read: false,
        ticketId: String(t.ticket_id),
      });
    } else {
      const label = statusName === 'failed' ? 'Failed' : 'Solved';
      list.push({
        id: `closed-${t.ticket_id}`,
        type: 'ticket_closed',
        title: `Ticket ${label} — #${t.ticket_id}`,
        description: `You marked ticket #${t.ticket_id} ${titleStr} as ${label}.`,
        timestamp: timeAgo(t.updated_at),
        read: true,
        ticketId: String(t.ticket_id),
      });
    }
  }

  return list.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
}

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  badge: string;
  label: string;
}> = {
  ticket_assigned: {
    icon: <UserCheck size={14} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Assigned',
  },
  reassignment: {
    icon: <UserPlus size={14} />,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    label: 'Reassigned',
  },
  new_comment: {
    icon: <MessageSquare size={14} />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    label: 'New Comment',
  },
  deadline: {
    icon: <Clock size={14} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Deadline',
  },
  status_update: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700 border-green-200',
    label: 'Status Update',
  },
  ticket_closed: {
    icon: <XCircle size={14} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    label: 'Ticket Closed',
  },
  ticket_renewed: {
    icon: <RefreshCw size={14} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Ticket Renewed',
  },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',             label: 'All' },
  { id: 'ticket_assigned', label: 'Assigned' },
  { id: 'reassignment',    label: 'Reassignments' },
  { id: 'new_comment',     label: 'Comments' },
  { id: 'deadline',        label: 'Deadlines' },
  { id: 'status_update',   label: 'Status Updates' },
  { id: 'ticket_closed',   label: 'Closed' },
  { id: 'ticket_renewed',  label: 'Renewed' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type];

  return (
    <div className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl border transition-all group ${
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
            <span className="text-[10px] text-gray-400 font-mono">{notification.ticketId}</span>
          )}
          <span className="text-[10px] text-gray-400 ml-auto">{notification.timestamp}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 mb-0.5">{notification.title}</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">{notification.description}</p>

        {/* Actions — inline below text on mobile, hover overlay on desktop */}
        <div className="flex items-center gap-1 mt-2 sm:hidden">
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
          <button
            title="View ticket"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Actions — desktop hover overlay (unchanged) */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
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
        <button
          title="View ticket"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssigneeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter]   = useState<FilterId>('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiTicket[]>('/tickets/assigned'),
      apiFetch<ApiTicket[]>('/tickets/assigned?resolved=true'),
    ])
      .then(([active, resolved]) => setNotifications(buildNotifications(active, resolved)))
      .catch((err) => {
        console.error('[Notifications] fetch error:', err);
        setError('Failed to load notifications.');
      })
      .finally(() => setLoading(false));
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0">
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
            className="flex items-center gap-1.5 text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Check size={12} />
            {/* Hide label text on very small screens */}
            <span className="hidden xs:inline sm:inline">Mark all as read</span>
          </button>
        )}
      </div>

      {/* ── Filter tabs — scrollable on mobile ── */}
      <div className="flex items-center gap-1 px-4 sm:px-8 py-3 bg-white border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => {
          const count = f.id === 'all'
            ? notifications.length
            : notifications.filter((n) => n.type === f.id).length;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}