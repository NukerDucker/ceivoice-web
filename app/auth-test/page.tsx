'use client';

import React, { useState } from 'react';
import {
  Bell, GitMerge, CheckCircle2, XCircle, Clock,
  Sparkles, ChevronRight, Check, Trash2,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/notification';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'draft_ready' | 'merge_suggestion' | 'ticket_closed' | 'deadline';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  ticketId?: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'merge_suggestion',
    title: 'Merge Suggestion — 3 Similar Requests',
    description: '3 users reported "The 3D printer in our lab is broken!" — the system recommends consolidating into a single draft ticket.',
    timestamp: '2 minutes ago',
    read: false,
    ticketId: 'DFT-042',
  },
  {
    id: 'n-2',
    type: 'draft_ready',
    title: 'New Draft Ready for Review',
    description: 'AI has processed a new request from user@company.com — "Cannot access classroom portal." Draft ticket DFT-043 is awaiting your review.',
    timestamp: '8 minutes ago',
    read: false,
    ticketId: 'DFT-043',
  },
  {
    id: 'n-3',
    type: 'deadline',
    title: 'Deadline Approaching — TKT-019',
    description: 'Ticket TKT-019 "Email server outage" is due in 2 hours and is still In Progress. Assigned to Dana Kim.',
    timestamp: '15 minutes ago',
    read: false,
    ticketId: 'TKT-019',
  },
  {
    id: 'n-4',
    type: 'draft_ready',
    title: 'New Draft Ready for Review',
    description: 'AI has processed a new request from student22@company.com — "Need to reset my database password." Draft ticket DFT-041 is awaiting your review.',
    timestamp: '1 hour ago',
    read: true,
    ticketId: 'DFT-041',
  },
  {
    id: 'n-5',
    type: 'ticket_closed',
    title: 'Ticket Solved — TKT-017',
    description: 'Ticket TKT-017 "VPN access issue" has been marked as Solved by Alex Chen.',
    timestamp: '2 hours ago',
    read: true,
    ticketId: 'TKT-017',
  },
  {
    id: 'n-6',
    type: 'ticket_closed',
    title: 'Ticket Failed — TKT-015',
    description: 'Ticket TKT-015 "Legacy system migration" has been marked as Failed by Sam Rivera. A resolution comment has been logged.',
    timestamp: '3 hours ago',
    read: true,
    ticketId: 'TKT-015',
  },
  {
    id: 'n-7',
    type: 'deadline',
    title: 'Deadline Passed — TKT-012',
    description: 'Ticket TKT-012 "Storage quota exceeded" passed its deadline 1 hour ago and remains Open. Immediate attention required.',
    timestamp: '4 hours ago',
    read: true,
    ticketId: 'TKT-012',
  },
  {
    id: 'n-8',
    type: 'merge_suggestion',
    title: 'Merge Suggestion — 2 Similar Requests',
    description: '2 users reported issues with the HR portal login. The system recommends merging into draft DFT-038.',
    timestamp: 'Yesterday',
    read: true,
    ticketId: 'DFT-038',
  },
];

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
  merge_suggestion: {
    icon: <GitMerge size={14} />,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    label: 'Merge Suggestion',
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
  { id: 'all',              label: 'All' },
  { id: 'draft_ready',     label: 'Draft Ready' },
  { id: 'merge_suggestion', label: 'Merge Suggestions' },
  { id: 'ticket_closed',   label: 'Ticket Closed' },
  { id: 'deadline',        label: 'Deadlines' },
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
            <span className="text-[10px] text-gray-400 font-mono">{notification.ticketId}</span>
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

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userRole="admin" userName="Palm Pollapat" />

      <div className="flex-1 flex flex-col overflow-hidden">
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
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
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
          {filtered.length === 0 ? (
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
    </div>
  );
}