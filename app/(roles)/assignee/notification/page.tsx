'use client';

import React, { useState } from 'react';
import {
  Bell, CheckCircle2, Clock, MessageSquare,
  UserCheck, UserPlus, ChevronRight, Check, Trash2,
  XCircle, RefreshCw,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/notification';

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

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'ticket_assigned',
    title: 'New Ticket Assigned — TKT-044',
    description: 'Ticket TKT-044 "Cannot access classroom portal" has been assigned to you by Admin. Please review and begin resolution.',
    timestamp: '3 minutes ago',
    read: false,
    ticketId: 'TKT-044',
  },
  {
    id: 'n-2',
    type: 'deadline',
    title: 'Deadline Approaching — TKT-039',
    description: 'Ticket TKT-039 "Email server outage" is due in 2 hours and is still In Progress. Immediate attention required.',
    timestamp: '10 minutes ago',
    read: false,
    ticketId: 'TKT-039',
  },
  {
    id: 'n-3',
    type: 'new_comment',
    title: 'New Public Comment — TKT-037',
    description: 'user@company.com left a public comment on TKT-037 "VPN access issue": "I\'m still experiencing this problem after the last update."',
    timestamp: '25 minutes ago',
    read: false,
    ticketId: 'TKT-037',
  },
  {
    id: 'n-4',
    type: 'reassignment',
    title: 'Ticket Reassigned to You — TKT-035',
    description: 'Alex Chen has reassigned TKT-035 "Legacy system migration" to you. A resolution comment has been logged by the previous assignee.',
    timestamp: '1 hour ago',
    read: false,
    ticketId: 'TKT-035',
  },
  {
    id: 'n-5',
    type: 'status_update',
    title: 'Status Updated — TKT-031',
    description: 'Dana Kim changed the status of TKT-031 "Storage quota exceeded" from In Progress to Solved. A resolution comment was submitted.',
    timestamp: '2 hours ago',
    read: true,
    ticketId: 'TKT-031',
  },
  {
    id: 'n-6',
    type: 'ticket_assigned',
    title: 'New Ticket Assigned — TKT-029',
    description: 'Ticket TKT-029 "Need to reset my database password" has been assigned to you by Admin. Category: IT Operations.',
    timestamp: '3 hours ago',
    read: true,
    ticketId: 'TKT-029',
  },
  {
    id: 'n-7',
    type: 'deadline',
    title: 'Deadline Passed — TKT-025',
    description: 'Ticket TKT-025 "HR portal login issue" passed its deadline 1 hour ago and remains Open. Please update the status immediately.',
    timestamp: '4 hours ago',
    read: true,
    ticketId: 'TKT-025',
  },
  {
    id: 'n-8',
    type: 'new_comment',
    title: 'New Public Comment — TKT-022',
    description: 'student22@company.com left a public comment on TKT-022 "Printer in lab is broken": "Has there been any progress on this? It\'s been 2 days."',
    timestamp: 'Yesterday',
    read: true,
    ticketId: 'TKT-022',
  },
  {
    id: 'n-9',
    type: 'ticket_closed',
    title: 'Ticket Solved — TKT-018',
    description: 'You marked TKT-018 "VPN configuration issue" as Solved. The user (creator@company.com) has been notified automatically.',
    timestamp: 'Yesterday',
    read: true,
    ticketId: 'TKT-018',
  },
  {
    id: 'n-10',
    type: 'ticket_closed',
    title: 'Ticket Failed — TKT-016',
    description: 'You marked TKT-016 "Legacy database migration" as Failed. Your resolution comment has been logged and the user has been notified.',
    timestamp: '2 days ago',
    read: true,
    ticketId: 'TKT-016',
  },
  {
    id: 'n-11',
    type: 'ticket_renewed',
    title: 'Ticket Renewed — TKT-014',
    description: 'TKT-014 "Email sync issue" has been reopened and reassigned to you. Previous status was Solved. Please review the updated request.',
    timestamp: '2 days ago',
    read: true,
    ticketId: 'TKT-014',
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

export default function AssigneeNotificationsPage() {
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
        <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-gray-100 shrink-0 overflow-x-auto">
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