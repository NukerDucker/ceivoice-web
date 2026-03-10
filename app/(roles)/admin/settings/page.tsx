'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Tag, Plus, Trash2, AlertCircle, Loader2,
  Search, ChevronDown, ChevronUp,
  Shield, User, Briefcase, X, TicketCheck, AlertTriangle, Check, Users,
} from 'lucide-react';
import { Header } from '@/components/layout/settingTB';
import { apiFetch } from '@/lib/api-client';
import type { ManagedUser, UserRole } from '@/types';
import type { ApiScope } from '@/types/api';

const TABS = [
  { id: 'scopes', label: 'Scope & Categories', icon: <Tag size={13} /> },
  { id: 'users',  label: 'User Management',    icon: <Users size={13} /> },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Scopes types ─────────────────────────────────────────────────────────────

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
  scope_id: number;
  label: string;
  color: string;
  assignees: { assignee_id: string; scope_id: number }[];
}

// ─── User Management types ────────────────────────────────────────────────────

interface ApiUser {
  user_id:             string;
  full_name:           string;
  email:               string;
  role:                string;
  created_at:          string;
  scopes:              ApiScope[];
  active_ticket_count: number;
  resolved_count:      number;
  submitted_count:     number;
  drafts_reviewed:     number;
  drafts_submitted:    number;
}

type ManagedUserEx = ManagedUser & {
  rawScopes:         ApiScope[];
  activeTicketCount: number;
  submittedCount:    number;
  draftsReviewed:    number;
  draftsSubmitted:   number;
};

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

const ROLE_CONFIG: Record<UserRole, {
  label: string; icon: React.ReactNode;
  bg: string; text: string; border: string;
}> = {
  admin:    { label: 'Admin',    icon: <Shield size={11} />,    bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  assignee: { label: 'Assignee', icon: <Briefcase size={11} />, bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  user:     { label: 'User',     icon: <User size={11} />,      bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200'   },
};

const AVATAR_COLORS = [
  'from-violet-400 to-violet-600',
  'from-blue-400 to-blue-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-500',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

function timeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function mapApiUser(u: ApiUser): ManagedUserEx {
  const role      = (u.role ?? 'user').toLowerCase() as UserRole;
  const rawScopes = u.scopes ?? [];
  const words     = (u.full_name ?? '').trim().split(/\s+/);
  const fallback  = (words[0]?.[0] ?? '') + (words[1]?.[0] ?? '');

  const ticketCount =
    role === 'assignee' ? u.active_ticket_count :
    role === 'admin'    ? u.drafts_submitted :
    u.submitted_count;

  return {
    id:                u.user_id,
    name:              u.full_name,
    email:             u.email,
    fallback:          fallback.toUpperCase() || '?',
    role,
    status:            'active',
    scopes:            rawScopes.map((s) => s.scope_name),
    rawScopes,
    joinedAt:          new Date(u.created_at),
    ticketCount,
    resolvedCount:     u.resolved_count,
    activeTicketCount: u.active_ticket_count,
    submittedCount:    u.submitted_count,
    draftsReviewed:    u.drafts_reviewed  ?? 0,
    draftsSubmitted:   u.drafts_submitted ?? 0,
    lastActive:        new Date(),
  };
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
  const [adding,   setAdding]   = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ scope_id: number; scope_name: string }[]>(`${API_BASE}/scopes`),
      apiFetch<UserFromApi[]>(`${API_BASE}/users`),
    ])
      .then(([globalScopes, users]) => {
        const scopeMap = buildScopeMap(users);
        const entries: ScopeEntry[] = globalScopes.map((gs, i) => ({
          scope_id: gs.scope_id,
          label: gs.scope_name,
          color: SCOPE_COLORS[i % SCOPE_COLORS.length],
          assignees: scopeMap.get(gs.scope_name) ?? [],
        }));
        setScopes(entries);
      })
      .catch(() => setError('Failed to load scopes. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) { setError('Scope name cannot be empty.'); return; }
    if (scopes.some((s) => s.label.toLowerCase() === trimmed.toLowerCase())) {
      setError('A scope with this name already exists.'); return;
    }
    setAdding(true);
    try {
      const created = await apiFetch<{ scope_id: number; scope_name: string }>(
        `${API_BASE}/scopes`,
        { method: 'POST', body: JSON.stringify({ scope_name: trimmed }) }
      );
      setScopes((prev) => [...prev, {
        scope_id: created.scope_id,
        label: created.scope_name,
        color: SCOPE_COLORS[prev.length % SCOPE_COLORS.length],
        assignees: [],
      }]);
      setNewLabel('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add scope.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (label: string) => {
    const entry = scopes.find((s) => s.label === label);
    if (!entry) return;

    setDeleting(label);
    try {
      await Promise.all(
        entry.assignees.map(({ assignee_id, scope_id }) =>
          apiFetch(`${API_BASE}/assignees/${assignee_id}/scopes/${scope_id}`, { method: 'DELETE' })
        )
      );
      await apiFetch(`${API_BASE}/scopes/${entry.scope_id}`, { method: 'DELETE' });
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
            disabled={adding}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors shrink-0 disabled:opacity-60"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Scope
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
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border truncate max-w-40 sm:max-w-none ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {s.assignees.length} assignee{s.assignees.length !== 1 ? 's' : ''}
                </span>
              </div>

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

// ─── User Management Tab ──────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon}{c.label}
    </span>
  );
}

function ScopeTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
      {label}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:text-blue-900 transition-colors">
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function ExpandedRow({ user, scopeOptions, onRoleChange, onScopeAdd, onScopeRemove }: {
  user: ManagedUserEx;
  scopeOptions:  string[];
  onRoleChange:  (id: string, role: UserRole) => void;
  onScopeAdd:    (id: string, scope: string) => void;
  onScopeRemove: (id: string, scope: string) => void;
}) {
  const [scopeOpen,       setScopeOpen]       = useState(false);
  const [confirmAdminFor, setConfirmAdminFor] = useState<string | null>(null);
  const scopeTriggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (scopeOpen && scopeTriggerRef.current) {
      setDropdownRect(scopeTriggerRef.current.getBoundingClientRect());
    }
  }, [scopeOpen]);

  return (
    <div className="px-4 sm:px-6 pb-5 pt-2 bg-gray-50/60 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

        {/* ── Role ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400">
              Role <span className="text-gray-300">(EP06-ST001)</span>
            </span>

            {confirmAdminFor === user.id ? (
              <span className="flex items-center gap-1.5 text-[10px] flex-wrap">
                <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                <span className="text-amber-700 font-semibold">Grant full admin?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRoleChange(user.id, 'admin'); setConfirmAdminFor(null); }}
                  className="px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmAdminFor(null); }}
                  className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <div className="relative">
                <select
                  value={user.role}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    const next = e.target.value as UserRole;
                    if (next === 'admin') {
                      setConfirmAdminFor(user.id);
                    } else {
                      onRoleChange(user.id, next);
                    }
                  }}
                  className={`w-full appearance-none pl-7 pr-8 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer focus:outline-none transition-all ${ROLE_CONFIG[user.role].bg} ${ROLE_CONFIG[user.role].text} ${ROLE_CONFIG[user.role].border}`}
                >
                  {(['user', 'assignee', 'admin'] as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
                <span className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${ROLE_CONFIG[user.role].text}`}>
                  {ROLE_CONFIG[user.role].icon}
                </span>
                <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${ROLE_CONFIG[user.role].text}`} />
              </div>
            )}
          </div>
        </div>

        {/* ── Scope Tags ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Tag size={10} /> Scope Tags <span className="font-normal text-gray-300">(EP06-ST002)</span>
          </p>
          {user.role === 'assignee' ? (
            <div className="relative">
              <button
                ref={scopeTriggerRef}
                onClick={(e) => { e.stopPropagation(); setScopeOpen((o) => !o); }}
                className="w-full flex items-start justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:border-blue-300 focus:outline-none focus:border-blue-400 transition-colors min-h-9"
              >
                <span className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                  {user.scopes.length > 0 ? (
                    user.scopes.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {s}
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); onScopeRemove(user.id, s); }}
                          className="hover:text-blue-900 cursor-pointer transition-colors leading-none"
                        >
                          <X size={9} />
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-300 italic">Select scopes…</span>
                  )}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-gray-400 shrink-0 mt-0.5 transition-transform duration-150 ${scopeOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {scopeOpen && dropdownRect && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setScopeOpen(false)} />
                  <div
                    className="fixed z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-y-auto max-h-56"
                    style={{ top: dropdownRect.bottom + 4, left: dropdownRect.left, width: dropdownRect.width }}
                  >
                    {scopeOptions.map((s) => {
                      const selected = user.scopes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={(e) => {
                            e.stopPropagation();
                            selected ? onScopeRemove(user.id, s) : onScopeAdd(user.id, s);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-[11px] transition-colors ${
                            selected
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span>{s}</span>
                          {selected && <Check size={11} className="text-blue-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-300 italic">
              {user.role === 'admin' ? 'Admins do not use scopes.' : 'Promote to Assignee to assign scopes.'}
            </p>
          )}
        </div>

        {/* ── Ticket Activity ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <TicketCheck size={10} /> Ticket Activity
          </p>
          <div className="grid grid-cols-2 gap-3">
            {user.role === 'admin' ? (
              <>
                <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Drafts Reviewed</p>
                  <p className="text-xl font-extrabold text-gray-900">{user.draftsReviewed}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Submitted</p>
                  <p className="text-xl font-extrabold text-violet-600">{user.ticketCount}</p>
                </div>
              </>
            ) : user.role === 'assignee' ? (
              <>
                <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Assigned</p>
                  <p className="text-xl font-extrabold text-gray-900">{user.ticketCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Solved</p>
                  <p className="text-xl font-extrabold text-green-600">{user.resolvedCount}</p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 col-span-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Requests Submitted</p>
                <p className="text-xl font-extrabold text-gray-900">{user.ticketCount}</p>
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400">
              Last active: <span className="font-semibold text-gray-600">{timeAgo(user.lastActive)}</span>
            </p>
            <p className="text-[10px] text-gray-400">
              Joined: <span className="font-semibold text-gray-600">
                {user.joinedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function UserRow({ user, scopeOptions, onRoleChange, onScopeAdd, onScopeRemove }: {
  user: ManagedUserEx;
  scopeOptions:  string[];
  onRoleChange:  (id: string, role: UserRole) => void;
  onScopeAdd:    (id: string, scope: string) => void;
  onScopeRemove: (id: string, scope: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 overflow-hidden transition-all duration-150">

      {/* ── Mobile row ── */}
      <div
        className="flex sm:hidden items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={`w-9 h-9 rounded-full bg-linear-to-br ${avatarColor(user.id)} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white text-[11px] font-bold">{user.fallback}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 truncate">{user.name}</span>
            <RoleBadge role={user.role} />
          </div>
          <span className="text-[11px] text-gray-400 truncate block">{user.email}</span>
          {user.role === 'assignee' && user.scopes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {user.scopes.slice(0, 2).map((s) => <ScopeTag key={s} label={s} />)}
              {user.scopes.length > 2 && (
                <span className="text-[10px] text-gray-400 font-medium">+{user.scopes.length - 2}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-bold text-gray-700">{user.ticketCount}</span>
          <span className="text-[9px] text-gray-400">
            {user.role === 'assignee' ? 'assigned' : 'submitted'}
          </span>
          <div className="text-gray-300 mt-0.5">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* ── Desktop row ── */}
      <div
        className="hidden sm:flex items-center gap-5 px-6 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={`w-9 h-9 rounded-full bg-linear-to-br ${avatarColor(user.id)} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white text-[11px] font-bold">{user.fallback}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate block">{user.name}</span>
          <span className="text-[11px] text-gray-400 truncate block">{user.email}</span>
        </div>
        <div className="w-22.5 shrink-0"><RoleBadge role={user.role} /></div>
        <div className="flex items-center gap-1 flex-wrap w-50 shrink-0">
          {user.role === 'assignee' && user.scopes.length > 0 ? (
            <>
              {user.scopes.slice(0, 2).map((s) => <ScopeTag key={s} label={s} />)}
              {user.scopes.length > 2 && (
                <span className="text-[10px] text-gray-400 font-medium">+{user.scopes.length - 2}</span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-gray-300 italic">
              {user.role === 'assignee' ? 'No scopes' : '—'}
            </span>
          )}
        </div>
        <div className="w-20 shrink-0 text-center">
          <span className="text-xs font-bold text-gray-700">{user.ticketCount}</span>
          <p className="text-[9px] text-gray-400">
            {user.role === 'assignee' ? 'assigned' : 'submitted'}
          </p>
        </div>
        <div className="w-22.5 shrink-0 text-right">
          <span className="text-[11px] text-gray-400">
            {user.joinedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="w-6 shrink-0 flex justify-center text-gray-300">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {expanded && (
        <ExpandedRow
          user={user}
          scopeOptions={scopeOptions}
          onRoleChange={onRoleChange}
          onScopeAdd={onScopeAdd}
          onScopeRemove={onScopeRemove}
        />
      )}
    </div>
  );
}

function UserManagementTab() {
  const [users,        setUsers]        = useState<ManagedUserEx[]>([]);
  const [scopeOptions, setScopeOptions] = useState<string[]>([]);
  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState<UserRole | 'all'>('all');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, scopes] = await Promise.all([
          apiFetch<ApiUser[]>('/admin/users'),
          apiFetch<{ scope_id: number; scope_name: string }[]>('/admin/scopes'),
        ]);
        setUsers(data.map(mapApiUser));
        setScopeOptions(scopes.map((s) => s.scope_name));
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(u.name ?? '').toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, filterRole]);

  const counts = useMemo(() => ({
    all:      users.length,
    admin:    users.filter((u) => u.role === 'admin').length,
    assignee: users.filter((u) => u.role === 'assignee').length,
    user:     users.filter((u) => u.role === 'user').length,
  }), [users]);

  const handleRoleChange = async (id: string, role: UserRole) => {
    try {
      await apiFetch(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body:   JSON.stringify({ role: role.toUpperCase() }),
      });
      setUsers((p) => p.map((u) =>
        u.id === id
          ? {
              ...u,
              role,
              scopes:    role === 'user' ? [] : u.scopes,
              rawScopes: role === 'user' ? [] : u.rawScopes,
              ticketCount:
                role === 'assignee' ? u.activeTicketCount :
                role === 'admin'    ? u.draftsSubmitted :
                u.submittedCount,
            }
          : u
      ));
    } catch { /* silently revert */ }
  };

  const handleScopeAdd = async (id: string, scope: string) => {
    try {
      const res: { scope: ApiScope } = await apiFetch(
        `/admin/assignees/${id}/scopes`,
        { method: 'POST', body: JSON.stringify({ scope_name: scope }) },
      );
      setUsers((p) => p.map((u) =>
        u.id === id
          ? { ...u, scopes: [...u.scopes, scope], rawScopes: [...u.rawScopes, res.scope] }
          : u
      ));
    } catch { /* silently handle */ }
  };

  const handleScopeRemove = async (id: string, scope: string) => {
    const user     = users.find((u) => u.id === id);
    const rawScope = user?.rawScopes.find((s) => s.scope_name === scope);
    if (!rawScope) return;
    try {
      await apiFetch(`/admin/assignees/${id}/scopes/${rawScope.scope_id}`, { method: 'DELETE' });
      setUsers((p) => p.map((u) =>
        u.id === id
          ? { ...u, scopes: u.scopes.filter((s) => s !== scope), rawScopes: u.rawScopes.filter((s) => s.scope_id !== rawScope.scope_id) }
          : u
      ));
    } catch { /* silently handle */ }
  };

  return (
    <div className="flex flex-col gap-3 -mx-4 sm:-mx-8 -mt-4 sm:-mt-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {([
            { value: 'all',      label: 'All'       },
            { value: 'admin',    label: 'Admins'    },
            { value: 'assignee', label: 'Assignees' },
            { value: 'user',     label: 'Users'     },
          ] as { value: UserRole | 'all'; label: string }[]).map((tab) => {
            const isActive = filterRole === tab.value;
            const count    = tab.value === 'all' ? counts.all : (counts[tab.value as keyof typeof counts] as number);
            return (
              <button
                key={tab.value}
                onClick={() => setFilterRole(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 outline-none focus:border-gray-300 transition-colors"
          />
        </div>
      </div>

      {/* ── Column headers — desktop only ── */}
      <div className="hidden sm:flex items-center gap-5 px-6 py-2 bg-gray-50 border-b border-gray-100">
        <div className="w-9 shrink-0" />
        <div className="flex-1     text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</div>
        <div className="w-22.5 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</div>
        <div className="w-50   shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scopes</div>
        <div className="w-20   shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tickets</div>
        <div className="w-22.5 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Joined</div>
        <div className="w-6 shrink-0" />
      </div>

      {/* ── User list ── */}
      <div className="px-4 sm:px-8 pb-4">
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <p className="text-sm">Loading users…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                scopeOptions={scopeOptions}
                onRoleChange={handleRoleChange}
                onScopeAdd={handleScopeAdd}
                onScopeRemove={handleScopeRemove}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-1 opacity-60">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
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
          {activeTab === 'users'  && <UserManagementTab />}
        </div>
      </div>
    </div>
  );
}
