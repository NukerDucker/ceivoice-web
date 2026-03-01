'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronUp,
  Shield, User, Briefcase, X, TicketCheck, Tag,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header }  from '@/components/layout/UserManagementTB';
import {
  MANAGED_USERS,
  type ManagedUser,
  type UserRole,
} from '@/lib/admin-dashboard-data';

// ─── Scope dropdown options (EP06-ST002) ──────────────────────────────────────

const SCOPE_OPTIONS = [
  'Network', 'Security', 'Database', 'Email', 'Performance',
  'Authentication', 'Storage', 'Mobile', 'Facilities',
  'HR', 'Finance', 'IT Ops', 'Compliance', 'Infrastructure',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

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

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Expanded panel ───────────────────────────────────────────────────────────

function ExpandedRow({ user, onRoleChange, onScopeAdd, onScopeRemove }: {
  user: ManagedUser;
  onRoleChange:  (id: string, role: UserRole) => void;
  onScopeAdd:    (id: string, scope: string) => void;
  onScopeRemove: (id: string, scope: string) => void;
}) {
  const [scopeOpen, setScopeOpen] = useState(false);
  const available = SCOPE_OPTIONS.filter((s) => !user.scopes.includes(s));

  return (
    <div className="px-6 pb-5 pt-2 bg-gray-50/60 border-t border-gray-100">
      <div className="grid grid-cols-3 gap-6">

        {/* Col 1 — Role */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</p>

          {user.role !== 'admin' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400">
                Role <span className="text-gray-300">(EP06-ST001)</span>
              </span>
              <div className="flex gap-1.5">
                {(['user', 'assignee'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={(e) => { e.stopPropagation(); onRoleChange(user.id, r); }}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      user.role === r
                        ? `${ROLE_CONFIG[r].bg} ${ROLE_CONFIG[r].text} ${ROLE_CONFIG[r].border}`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Col 2 — Scope Tags */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Tag size={10} /> Scope Tags <span className="font-normal text-gray-300">(EP06-ST002)</span>
          </p>

          {user.role === 'assignee' ? (
            <>
              <div className="flex flex-wrap gap-1.5 min-h-6">
                {user.scopes.length > 0
                  ? user.scopes.map((s) => <ScopeTag key={s} label={s} onRemove={() => onScopeRemove(user.id, s)} />)
                  : <span className="text-[10px] text-gray-300 italic">No scopes assigned yet</span>
                }
              </div>
              {available.length > 0 && (
                <div className="relative w-fit">
                  <button
                    onClick={(e) => { e.stopPropagation(); setScopeOpen((o) => !o); }}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    + Add scope
                  </button>
                  {scopeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setScopeOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-40 max-h-48 overflow-y-auto">
                        {available.map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); onScopeAdd(user.id, s); setScopeOpen(false); }}
                            className="w-full text-left px-4 py-2 text-[11px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-[10px] text-gray-300 italic">
              {user.role === 'admin' ? 'Admins do not use scopes.' : 'Promote to Assignee to assign scopes.'}
            </p>
          )}
        </div>

        {/* Col 3 — Ticket Activity */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <TicketCheck size={10} /> Ticket Activity
          </p>
          <div className="grid grid-cols-2 gap-3">
            {user.role === 'assignee' ? (
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

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user, onRoleChange, onScopeAdd, onScopeRemove }: {
  user: ManagedUser;
  onRoleChange:  (id: string, role: UserRole) => void;
  onScopeAdd:    (id: string, scope: string) => void;
  onScopeRemove: (id: string, scope: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 overflow-hidden transition-all duration-150">
      <div
        className="flex items-center gap-5 px-6 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full bg-linear-to-br ${avatarColor(user.id)} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white text-[11px] font-bold">{user.fallback}</span>
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate block">{user.name}</span>
          <span className="text-[11px] text-gray-400 truncate block">{user.email}</span>
        </div>

        {/* Role */}
        <div className="w-22.5 shrink-0"><RoleBadge role={user.role} /></div>

        {/* Scopes preview */}
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

        {/* Ticket count */}
        <div className="w-20 shrink-0 text-center">
          <span className="text-xs font-bold text-gray-700">{user.ticketCount}</span>
          <p className="text-[9px] text-gray-400">{user.role === 'assignee' ? 'assigned' : 'submitted'}</p>
        </div>

        {/* Joined */}
        <div className="w-22.5 shrink-0 text-right">
          <span className="text-[11px] text-gray-400">
            {user.joinedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Chevron */}
        <div className="w-6 shrink-0 flex justify-center text-gray-300">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {expanded && (
        <ExpandedRow
          user={user}
          onRoleChange={onRoleChange}
          onScopeAdd={onScopeAdd}
          onScopeRemove={onScopeRemove}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserManagementPage() {
  const [users,      setUsers]      = useState<ManagedUser[]>(MANAGED_USERS);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const filtered = useMemo(() => users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, filterRole]);

  const counts = useMemo(() => ({
    all:      users.length,
    admin:    users.filter((u) => u.role === 'admin').length,
    assignee: users.filter((u) => u.role === 'assignee').length,
    user:     users.filter((u) => u.role === 'user').length,
  }), [users]);

  const handleRoleChange  = (id: string, role: UserRole) =>
    setUsers((p) => p.map((u) => u.id === id ? { ...u, role, scopes: role === 'user' ? [] : u.scopes } : u));
  const handleScopeAdd    = (id: string, scope: string) =>
    setUsers((p) => p.map((u) => u.id === id ? { ...u, scopes: [...u.scopes, scope] } : u));
  const handleScopeRemove = (id: string, scope: string) =>
    setUsers((p) => p.map((u) => u.id === id ? { ...u, scopes: u.scopes.filter((s) => s !== scope) } : u));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 px-8 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1">
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

          <div className="relative w-64">
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

        {/* ── Column headers ── */}
        <div className="flex items-center gap-5 px-6 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="w-9 shrink-0" />
          <div className="flex-1     text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</div>
          <div className="w-22.5 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</div>
          <div className="w-50   shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scopes</div>
          <div className="w-20   shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tickets</div>
          <div className="w-22.5 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Joined</div>
          <div className="w-6 shrink-0" />
        </div>

        {/* ── User list ── */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <div className="flex flex-col gap-2">
            {filtered.length > 0 ? (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
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
    </div>
  );
}