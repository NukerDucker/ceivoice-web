'use client';

import React, { useState } from 'react';
import {
  Bell, CheckCircle2, Clock, MessageSquare,
  UserCheck, ChevronRight, Check, Trash2,
  XCircle, RefreshCw, Sparkles, Wrench,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/notification';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'ticket_received'   // Your ticket was received
  | 'ticket_assigned'   // An assignee picked up your ticket
  | 'new_comment'       // Assignee replied on your ticket
  | 'status_update'     // Status changed on your ticket
  | 'ticket_solved'     // Your ticket was solved
  | 'ticket_failed'     // Your ticket could not be resolved
  | 'ticket_renewed';   // Your ticket was reopened

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
    type: 'new_comment',
    title: 'New Reply on REQ-001',
    description: 'Somsak Jaidee replied: "That narrows it down to the GPU power management. I\'ve updated your display driver remotely. Please restart and let me know."',
    timestamp: '5 minutes ago',
    read: false,
    ticketId: 'REQ-001',
  },
  {
    id: 'n-2',
    type: 'ticket_assigned',
    title: 'Your Request Has Been Assigned — REQ-004',
    description: 'Krit Sombat has been assigned to your ticket "VPN connection drops every 30 minutes" and will begin working on it shortly.',
    timestamp: '30 minutes ago',
    read: false,
    ticketId: 'REQ-004',
  },
  {
    id: 'n-3',
    type: 'status_update',
    title: 'Status Updated — REQ-001',
    description: 'Your ticket "Laptop screen flickering issue" status has changed from Assigned to Solving. Somsak Jaidee is actively working on your request.',
    timestamp: '1 hour ago',
    read: false,
    ticketId: 'REQ-001',
  },
  {
    id: 'n-4',
    type: 'ticket_received',
    title: 'Request Received — REQ-006',
    description: 'Your request "Printer on 3rd floor not responding" has been received and is pending admin review. You\'ll be notified once it\'s assigned.',
    timestamp: '2 hours ago',
    read: false,
    ticketId: 'REQ-006',
  },
  {
    id: 'n-5',
    type: 'ticket_solved',
    title: 'Request Solved — REQ-003',
    description: 'Great news! Your request "Request for Adobe Creative Cloud license" has been marked as solved by Nipa Thong. Your license should now be active.',
    timestamp: '3 hours ago',
    read: true,
    ticketId: 'REQ-003',
  },
  {
    id: 'n-6',
    type: 'new_comment',
    title: 'New Reply on REQ-004',
    description: 'Krit Sombat replied: "Acknowledged. This sounds like the known AnyConnect idle-timeout issue. I\'ll schedule a remote session to adjust your VPN profile."',
    timestamp: 'Yesterday',
    read: true,
    ticketId: 'REQ-004',
  },
  {
    id: 'n-7',
    type: 'ticket_solved',
    title: 'Request Solved — REQ-005',
    description: 'Your request "New employee onboarding equipment setup" has been resolved. All equipment has been delivered and configured for Ananya Srirak.',
    timestamp: 'Yesterday',
    read: true,
    ticketId: 'REQ-005',
  },
  {
    id: 'n-8',
    type: 'ticket_failed',
    title: 'Request Could Not Be Resolved — REQ-008',
    description: 'Unfortunately, "Conference room TV display not working" could not be resolved. The display requires hardware replacement. A procurement request has been escalated.',
    timestamp: '2 days ago',
    read: true,
    ticketId: 'REQ-008',
  },
  {
    id: 'n-9',
    type: 'ticket_renewed',
    title: 'Request Reopened — REQ-007',
    description: 'Your ticket "Email client crashing on startup" has been reopened after the issue recurred. Nipa Thong has been notified and will follow up.',
    timestamp: '2 days ago',
    read: true,
    ticketId: 'REQ-007',
  },
  {
    id: 'n-10',
    type: 'ticket_assigned',
    title: 'Your Request Has Been Assigned — REQ-002',
    description: 'Your ticket "Cannot access internal HR portal" is now assigned. The IT team has been notified and will begin investigation.',
    timestamp: '3 days ago',
    read: true,
    ticketId: 'REQ-002',
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
  ticket_received: {
    icon: <Sparkles size={14} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    label: 'Received',
  },
  ticket_assigned: {
    icon: <UserCheck size={14} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Assigned',
  },
  new_comment: {
    icon: <MessageSquare size={14} />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    label: 'New Reply',
  },
  status_update: {
    icon: <Wrench size={14} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Status Update',
  },
  ticket_solved: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: 'Solved',
  },
  ticket_failed: {
    icon: <XCircle size={14} />,
    color: 'text-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-600 border-red-200',
    label: 'Failed',
  },
  ticket_renewed: {
    icon: <RefreshCw size={14} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Reopened',
  },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',             label: 'All' },
  { id: 'new_comment',     label: 'Replies' },
  { id: 'status_update',   label: 'Status Updates' },
  { id: 'ticket_assigned', label: 'Assigned' },
  { id: 'ticket_solved',   label: 'Solved' },
  { id: 'ticket_failed',   label: 'Failed' },
  { id: 'ticket_renewed',  label: 'Reopened' },
  { id: 'ticket_received', label: 'Received' },
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
        ? 'bg-gray-50 border-transparent'
        : 'bg-orange-50/40 border-orange-100'
    }`}>
      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
        {cfg.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {!notification.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
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

export default function UserNotificationsPage() {
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
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* ── Page header ── */}
        <div className="flex items-center justify-between px-8 py-5 bg-gray-50 border-b border-gray-100 shrink-0">
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
        <div className="flex items-center gap-1 px-8 py-3 bg-gray-50 border-b border-gray-100 shrink-0 overflow-x-auto">
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