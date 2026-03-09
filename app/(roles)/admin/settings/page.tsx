'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/settingTB';
import { SCOPE_NAMES } from '@/lib/config';
import { apiFetch } from '@/lib/api-client';

const TABS = [
  { id: 'scopes', label: 'Scope & Categories', icon: <Tag size={13} /> },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssigneeScopeRecord {
  scope_id: number;
  scope_name: string;
  assignee_id: string;
}

interface UserFromApi {
  user_id: string;
  role: string;
  scopes: AssigneeScopeRecord[];
}

interface ScopeEntry {
  label: string;
  color: string;
  // assignees who currently hold this scope (for delete API calls)
  assignees: { assignee_id: string; scope_id: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const API_BASE = '/admin';

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
    <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
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

function buildScopeMap(users: UserFromApi[]): Map<string, { assignee_id: string; scope_id: number }[]> {
  const map = new Map<string, { assignee_id: string; scope_id: number }[]>();
  for (const user of users) {
    if (!Array.isArray(user.scopes)) continue;
    for (const s of user.scopes) {
      if (!map.has(s.scope_name)) map.set(s.scope_name, []);
      map.get(s.scope_name)!.push({ assignee_id: s.assignee_id, scope_id: s.scope_id });
    }
  }
  return map;
}

function ScopesTab() {
  const [scopes,   setScopes]   = useState<ScopeEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch real assignee data and build scope list
  useEffect(() => {
    apiFetch<UserFromApi[]>(`${API_BASE}/users`)
      .then((users) => {
        const scopeMap = buildScopeMap(users);

        // Union of SCOPE_NAMES + any extra scopes from DB
        const allLabels = new Set<string>([
          ...SCOPE_NAMES,
          ...Array.from(scopeMap.keys()),
        ]);

        const entries: ScopeEntry[] = Array.from(allLabels).map((label, i) => ({
          label,
          color: SCOPE_COLORS[i % SCOPE_COLORS.length],
          assignees: scopeMap.get(label) ?? [],
        }));

        setScopes(entries);
      })
      .catch(() => setError('Failed to load scopes. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) { setError('Scope name cannot be empty.'); return; }
    if (scopes.some((s) => s.label.toLowerCase() === trimmed.toLowerCase())) {
      setError('A scope with this name already exists.'); return;
    }
    setScopes((prev) => [...prev, {
      label: trimmed,
      color: SCOPE_COLORS[prev.length % SCOPE_COLORS.length],
      assignees: [],
    }]);
    setNewLabel('');
    setError('');
  };

  const handleDelete = async (label: string) => {
    const entry = scopes.find((s) => s.label === label);
    if (!entry) return;

    setDeleting(label);
    try {
      // Remove scope from every assignee that currently holds it
      await Promise.all(
        entry.assignees.map(({ assignee_id, scope_id }) =>
          apiFetch(`${API_BASE}/assignees/${assignee_id}/scopes/${scope_id}`, { method: 'DELETE' })
        )
      );
      setScopes((prev) => prev.filter((s) => s.label !== label));
    } catch {
      setError(`Failed to delete scope "${label}". Please try again.`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <SectionHeader
          icon={<Tag size={14} />}
          title="Scope & Category Management"
          subtitle="Predefined tags used for Assignee routing and AI suggestions"
        />
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-xs">
          <Loader2 size={14} className="animate-spin" /> Loading scopes…
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        icon={<Tag size={14} />}
        title="Scope & Category Management"
        subtitle="Predefined tags used for Assignee routing and AI suggestions"
      />
      <div className="p-4 sm:p-6">

        {/* Add new */}
        <div className="flex flex-col sm:flex-row gap-2 mb-1">
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
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors shrink-0"
          >
            <Plus size={13} /> Add Scope
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mb-3 mt-1">
            <AlertCircle size={11} /> {error}
          </p>
        )}

        {/* Scope list */}
        <div className="mt-4 flex flex-col gap-1.5">
          {scopes.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 group transition-all"
            >
              {/* Left: tag + assignee count */}
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border truncate max-w-[160px] sm:max-w-none ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {s.assignees.length} assignee{s.assignees.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Right: delete button */}
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => handleDelete(s.label)}
                  disabled={deleting === s.label}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  {deleting === s.label
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-gray-400">
          {scopes.length} scopes total — changes apply to User Management and AI Draft suggestions immediately.
        </p>
      </div>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('scopes');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 px-4 sm:px-8 py-3 bg-white border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
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
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {activeTab === 'scopes' && <ScopesTab />}
        </div>
      </div>
    </div>
  );
}
