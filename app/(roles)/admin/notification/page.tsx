'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell, MessageSquare,
  UserCheck, ChevronRight, Check, Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/notification';
import { apiFetch } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { ApiNotification } from '@/types/api';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  badge: string;
  label: string;
}> = {
  assignment: {
    icon: <UserCheck size={14} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Assignment',
  },
  comment: {
    icon: <MessageSquare size={14} />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    label: 'Comment',
  },
};

const FALLBACK_CONFIG = {
  icon: <Bell size={14} />,
  color: 'text-gray-600',
  bg: 'bg-gray-100',
  badge: 'bg-gray-100 text-gray-600 border-gray-200',
  label: 'Notification',
};

function getCfg(type: string) {
  return TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
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

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onRead,
  onDelete,
  onView,
}: {
  notification: ApiNotification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (ticketId: number) => void;
}) {
  const cfg = getCfg(notification.type);

  return (
    <div className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl border transition-all group ${
      notification.is_read
        ? 'bg-white border-gray-100'
        : 'bg-blue-50/30 border-blue-100'
    }`}>
      <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {!notification.is_read && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">#{notification.ticket_id}</span>
          <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(notification.created_at)}</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">{notification.message}</p>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 mt-2 sm:hidden">
          {!notification.is_read && (
            <button onClick={() => onRead(notification.notification_id)} title="Mark as read"
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 transition-colors">
              <Check size={13} />
            </button>
          )}
          <button onClick={() => onDelete(notification.notification_id)} title="Delete"
            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 transition-colors">
            <Trash2 size={13} />
          </button>
          <button onClick={() => onView(notification.ticket_id)} title="View ticket"
            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Desktop hover actions */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {!notification.is_read && (
          <button onClick={() => onRead(notification.notification_id)} title="Mark as read"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <Check size={13} />
          </button>
        )}
        <button onClick={() => onDelete(notification.notification_id)} title="Delete"
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={13} />
        </button>
        <button onClick={() => onView(notification.ticket_id)} title="View ticket"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [activeFilter, setActiveFilter]   = useState<string>('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiNotification[]>('/tickets/notifications')
      .then(setNotifications)
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const types = ['all', ...Array.from(new Set(notifications.map((n) => n.type)))];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const markAllRead = async () => {
    await apiFetch('/tickets/notifications/read-all', { method: 'PUT' });
    setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: number) => {
    await apiFetch(`/tickets/notifications/${id}/read`, { method: 'PUT' });
    setNotifications((p) => p.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
  };

  const remove = async (id: number) => {
    await apiFetch(`/tickets/notifications/${id}`, { method: 'DELETE' });
    setNotifications((p) => p.filter((n) => n.notification_id !== id));
  };

  const viewTicket = (ticketId: number) =>
    router.push(`/admin/review-ticket?id=${ticketId}`);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <Header />

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
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Check size={12} />
            <span className="hidden sm:inline">Mark all as read</span>
            <span className="sm:hidden">Mark all</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 px-4 sm:px-8 py-3 bg-white border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
        {types.map((t) => {
          const count = t === 'all' ? notifications.length : notifications.filter((n) => n.type === t).length;
          const isActive = activeFilter === t;
          return (
            <button key={t} onClick={() => setActiveFilter(t)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}>
              {t === 'all' ? 'All' : getCfg(t).label}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

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
                key={n.notification_id}
                notification={n}
                onRead={markRead}
                onDelete={remove}
                onView={viewTicket}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
