'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  Ticket,
  BarChart3,
  User,
  Bell,
  Settings,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/ReviewTicketTB';
import {
  DASHBOARD_ASSIGNEES,
  DASHBOARD_TICKETS,
  AI_SUGGESTIONS,
  ORIGINAL_MESSAGES,
} from '@/lib/admin-dashboard-data';
import type { DashboardAssignee, DashboardTicket } from '@/lib/admin-dashboard-data';

// ─── Local Type Aliases ───────────────────────────────────────────────────────

type Assignee = DashboardAssignee;
type TicketItem = DashboardTicket;

// ─── Form / UI-only Types ─────────────────────────────────────────────────────

interface FormValues {
  title?: string;
  category?: string;
  summary?: string;
  solution?: string;
  assigneeIdx?: number;
  deadline?: string;
  deadlineTime?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  hasSubmenu?: boolean;
}

// ─── Menu Config ──────────────────────────────────────────────────────────────

const menuConfig: Record<string, MenuItem[]> = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket, hasSubmenu: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, hasSubmenu: true },
    { id: 'assignees', label: 'Assignees', icon: Users },
    { id: 'profile', label: 'Profile', icon: User, hasSubmenu: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, hasSubmenu: true },
    { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: true },
  ],
  user: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket, hasSubmenu: true },
    { id: 'profile', label: 'Profile', icon: User, hasSubmenu: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, hasSubmenu: true },
    { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: true },
  ],
  assignee: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket, hasSubmenu: true },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User, hasSubmenu: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, hasSubmenu: true },
    { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: true },
  ],
};

// ─── AdminSidebar Component ───────────────────────────────────────────────────

interface SidebarProps {
  userRole?: 'user' | 'admin' | 'assignee';
  userName?: string;
  userAvatar?: string | null;
  activeMenu?: string;
  onMenuChange?: (id: string) => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({
  userRole = 'admin',
  userName = 'Palm Pollapat',
  userAvatar = null,
  activeMenu: externalActive,
  onMenuChange,
}) => {
  const [internalActive, setInternalActive] = useState('tickets');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['tickets']);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeMenu = externalActive ?? internalActive;
  const menuItems: MenuItem[] = menuConfig[userRole] ?? menuConfig.user;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleMenuClick = (menuId: string) => {
    setInternalActive(menuId);
    onMenuChange?.(menuId);
  };

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        background: 'linear-gradient(to bottom, #ffffff, #F9FAFB)',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        width: isMinimized ? 68 : 272,
        flexShrink: 0,
      }}
    >
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, height: 208, background: 'linear-gradient(to bottom, rgba(249,115,22,0.08), rgba(249,115,22,0.04), transparent)', pointerEvents: 'none' }} />

      {/* Logo & Minimize */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #E5E7EB' }}>
        {!isMinimized && (
          <span style={{ fontSize: 20, fontWeight: 800, color: '#EA580C', letterSpacing: '-0.5px' }}>
            🎤 CEIVoice
          </span>
        )}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title={isMinimized ? 'Expand' : 'Minimize'}
        >
          <ChevronDown
            size={20}
            color="#4B5563"
            style={{ transform: isMinimized ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ position: 'relative', zIndex: 10, flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          const isExpanded = expandedMenus.includes(item.id);

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  handleMenuClick(item.id);
                  if (item.hasSubmenu) toggleMenu(item.id);
                }}
                title={isMinimized ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive ? 'linear-gradient(to right, #111827, #1F2937)' : 'transparent',
                  color: isActive ? '#fff' : '#4B5563',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(249,115,22,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  {!isMinimized && (
                    <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                      {item.label}
                    </span>
                  )}
                </div>
                {!isMinimized && item.hasSubmenu && (
                  <ChevronDown
                    size={15}
                    color={isActive ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div
        style={{ position: 'relative', zIndex: 10, padding: '12px 14px', borderTop: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #FB923C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {!isMinimized && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{userRole}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 13,
  color: '#111827',
  background: '#F9FAFB',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.65,
};

function btnStyle(bg: string, color: string, border: string, bold = false): CSSProperties {
  return {
    padding: '9px 16px',
    background: bg,
    color,
    border: `1.5px solid ${border}`,
    borderRadius: 99,
    fontSize: 12.5,
    fontWeight: bold ? 700 : 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DraftTicketPage() {
  const selectedId = 'TD-001238';
  const [form, setForm] = useState<Record<string, FormValues>>({});

  const currentTicket = DASHBOARD_TICKETS.find((t) => t.ticketId === selectedId) ?? null;
  const ai = AI_SUGGESTIONS[selectedId] ?? Object.values(AI_SUGGESTIONS)[0];
  const original = ORIGINAL_MESSAGES[selectedId] ?? Object.values(ORIGINAL_MESSAGES)[0];

  function getField<K extends keyof FormValues>(key: K, fallback: FormValues[K]): FormValues[K] {
    const val = form[selectedId]?.[key];
    return val !== undefined ? val : fallback;
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((f) => ({ ...f, [selectedId]: { ...(f[selectedId] ?? {}), [key]: value } }));
  }

  const titleVal = getField('title', currentTicket?.title ?? '') as string;
  const categoryVal = getField('category', ai.category) as string;
  const summaryVal = getField('summary', ai.summary) as string;
  const solutionVal = getField('solution', ai.suggestedSolution) as string;
  const assigneeIdxVal = getField('assigneeIdx', 0) as number;
  const deadlineVal = getField('deadline', ai.deadline) as string;
  const deadlineTimeVal = getField('deadlineTime', ai.deadlineTime) as string;

  const subtitle = currentTicket
    ? `Draft ${currentTicket.ticketId} · created ${timeAgo(currentTicket.date)}`
    : undefined;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#F3F4F6', color: '#111827', overflow: 'hidden' }}>

      {/* ── AdminSidebar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0, position: 'relative' }}>
        <AdminSidebar
          userRole="admin"
          userName="Palm Pollapat"
          userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Palm"
          activeMenu="tickets"
        />
      </div>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <Header
          title="Review and Edit Draft Ticket"
          subtitle={subtitle}
        />

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Original Request */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 18px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, borderRadius: '12px 12px 0 0' }}>
              <span style={{ fontSize: 16 }}>✉️</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>Original request</span>
            </div>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                From: {original.from}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>{original.body}</div>
            </div>
          </div>

          {/* AI Suggestion */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 18px', background: '#F0F9FF', borderBottom: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: 10, borderRadius: '12px 12px 0 0' }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0369A1' }}>AI suggestion</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                Auto-generated
              </span>
            </div>

            <div style={{ padding: '18px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <Field label="Title">
                <input value={titleVal} onChange={(e) => setField('title', e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Category">
                <input value={categoryVal} onChange={(e) => setField('category', e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Summary">
                <textarea value={summaryVal} onChange={(e) => setField('summary', e.target.value)} rows={3} style={textareaStyle} />
              </Field>

              <Field label="Suggested Solution">
                <textarea value={solutionVal} onChange={(e) => setField('solution', e.target.value)} rows={3} style={textareaStyle} />
              </Field>

              <Field label="Assignee">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB' }}>
                  {DASHBOARD_ASSIGNEES.map((a, i) => (
                    <button
                      key={a.name}
                      onClick={() => setField('assigneeIdx', i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', background: assigneeIdxVal === i ? '#DBEAFE' : '#F3F4F6', color: assigneeIdxVal === i ? '#1D4ED8' : '#4B5563', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      <img src={a.avatar} alt={a.name} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                      {a.fallback}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Deadline">
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="date" value={deadlineVal} onChange={(e) => setField('deadline', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <input type="time" value={deadlineTimeVal} onChange={(e) => setField('deadlineTime', e.target.value)} style={{ ...inputStyle, width: 110, flex: 'none' }} />
                </div>
              </Field>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, flexWrap: 'wrap' }}>
                <button style={btnStyle('#FFFBEB', '#D97706', '#FDE68A')}>Save Draft</button>
                <button style={btnStyle('#F0FDF4', '#15803D', '#BBF7D0', true)}>Submit as New Ticket</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}