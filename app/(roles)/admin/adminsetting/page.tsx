'use client';

import React, { useState } from 'react';
import {
  Tag, Plus, Pencil, Trash2, Check, X, AlertCircle,
} from 'lucide-react';

// ─── Tabs config (add future tabs here) ──────────────────────────────────────

const TABS = [
  { id: 'scopes', label: 'Scope & Categories', icon: <Tag size={13} /> },
] as const;

type TabId = typeof TABS[number]['id'];
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header }  from '@/components/layout/settingTB';
import { DASHBOARD_ASSIGNEES } from '@/lib/admin-dashboard-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScopeCategory {
  id: string;
  label: string;
  color: string;
  assigneeCount: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SCOPE_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

const INITIAL_SCOPES: ScopeCategory[] = [
  'Network', 'Security', 'Database', 'Email', 'Performance',
  'Authentication', 'Storage', 'Mobile', 'Facilities',
  'HR', 'Finance', 'IT Ops', 'Compliance', 'Infrastructure',
].map((label, i) => ({
  id: `scope-${i}`,
  label,
  color: SCOPE_COLORS[i % SCOPE_COLORS.length],
  assigneeCount: DASHBOARD_ASSIGNEES.filter((_, idx) => idx % (i + 2) === 0).length,
}));

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: {
  icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Scope Tag Management ─────────────────────────────────────────────────────

function ScopesTab() {
  const [scopes, setScopes] = useState<ScopeCategory[]>(INITIAL_SCOPES);
  const [newLabel, setNewLabel]   = useState('');
  const [editId,   setEditId]     = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) { setError('Scope name cannot be empty.'); return; }
    if (scopes.some((s) => s.label.toLowerCase() === trimmed.toLowerCase())) {
      setError('A scope with this name already exists.'); return;
    }
    setScopes((p) => [...p, {
      id: `scope-${Date.now()}`,
      label: trimmed,
      color: SCOPE_COLORS[p.length % SCOPE_COLORS.length],
      assigneeCount: 0,
    }]);
    setNewLabel('');
    setError('');
  };

  const handleDelete = (id: string) => setScopes((p) => p.filter((s) => s.id !== id));

  const startEdit = (s: ScopeCategory) => { setEditId(s.id); setEditLabel(s.label); };

  const saveEdit = (id: string) => {
    const trimmed = editLabel.trim();
    if (!trimmed) return;
    setScopes((p) => p.map((s) => s.id === id ? { ...s, label: trimmed } : s));
    setEditId(null);
  };

  return (
    <SectionCard>
      <SectionHeader
        icon={<Tag size={14} />}
        title="Scope & Category Management"
        subtitle="Predefined tags used for Assignee routing and AI suggestions"
      />
      <div className="p-6">
        {/* Add new */}
        <div className="flex gap-2 mb-1">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => { setNewLabel(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New scope name (e.g. Hardware, Legal…)"
            className="flex-1 text-xs border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-gray-400 bg-gray-50 transition-colors placeholder:text-gray-300"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors shrink-0"
          >
            <Plus size={13} /> Add Scope
          </button>
        </div>
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mb-3 mt-1">
            <AlertCircle size={11} /> {error}
          </p>
        )}

        {/* List */}
        <div className="mt-4 flex flex-col gap-1.5">
          {scopes.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 group transition-all">
              <div className="flex items-center gap-3">
                {editId === s.id ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(s.id); if (e.key === 'Escape') setEditId(null); }}
                    className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 outline-none focus:border-gray-500 bg-white"
                  />
                ) : (
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border ${s.color}`}>
                    {s.label}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {s.assigneeCount} assignee{s.assigneeCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editId === s.id ? (
                  <>
                    <button onClick={() => saveEdit(s.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"><Check size={13} /></button>
                    <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-gray-400">{scopes.length} scopes total — changes apply to User Management and AI Draft suggestions immediately.</p>
      </div>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('scopes');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userRole="admin" userName="Palm Pollapat" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-gray-100 shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'scopes' && <ScopesTab />}
        </div>
      </div>
    </div>
  );
}