'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { apiFetch } from '@/lib/api-client';
import { CATEGORY_COLORS, ASSIGNEE_STATUS_STYLE, getCatStyle, BAR_CHART_COLORS } from '@/lib/admin-dashboard-utils';

// ─── API Types ────────────────────────────────────────────────────────────────

interface AdminMetrics {
  period: string;
  metrics: {
    total_tickets: number;
    tickets_by_status: Array<{ status_id: number; count: number }>;
    avg_resolution_time_hours: number;
    top_categories: Array<{ category_id: number; category_name: string; count: number }>;
    current_backlog: number;
    assignee_workload: Array<{ assignee_id: string; assignee_name: string; active_tickets: number }>;
  };
}

interface ApiDraft {
  ticket_id: number;
  title: string | null;
  created_at: string;
  category: { category_id: number; name: string } | null;
  ticket_requests: Array<{
    request: { email: string; name: string | null } | null;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Range = '7D' | '30D' | '90D';

const RANGE_PERIOD: Record<Range, string> = {
  '7D': 'last_7_days',
  '30D': 'last_30_days',
  '90D': 'all_time',
};

const STATUS_NAMES: Record<number, string> = {
  1: 'Draft', 2: 'New', 3: 'Assigned', 4: 'Solving', 5: 'Solved', 6: 'Failed', 7: 'Renew',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor, bgColor }: {
  label: string; value: string | number; sub: string; subColor: string; bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bgColor }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

function DonutChart({ categories, total }: {
  categories: Array<{ category_name: string; count: number }>;
  total: number;
}) {
  const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;
  const slices = categories.reduce<Array<{
    category_name: string; count: number; dash: number; gap: number; offset: number; color: string;
  }>>((acc, d, i) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    const dash = total > 0 ? (d.count / total) * circ : 0;
    acc.push({ ...d, dash, gap: circ - dash, offset: prevOffset, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <svg width={180} height={180} viewBox="0 0 180 180">
        {slices.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={28} />
        ) : slices.map((s, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={28}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ * 0.25}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: '#0f172a' }}>
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 9, fill: '#64748b' }}>
          total
        </text>
      </svg>
      <div className="w-full mt-4 space-y-2">
        {slices.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
              <span className="text-slate-700">{d.category_name}</span>
            </div>
            <span className="font-semibold text-slate-900">
              {d.count} ({total > 0 ? Math.round((d.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-slate-400 text-center">No category data yet.</p>
        )}
      </div>
    </div>
  );
}

function StatusBarChart({ byStatus }: { byStatus: Array<{ status_id: number; count: number }> }) {
  const sorted = [...byStatus].sort((a, b) => a.status_id - b.status_id);
  const maxVal = Math.max(...sorted.map((s) => s.count), 1);
  const maxH   = 120;

  return (
    <div className="flex items-end justify-between gap-2 mt-6" style={{ height: maxH + 56 }}>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-400 text-center w-full">No data yet.</p>
      ) : sorted.map((s, i) => {
        const h = Math.max(8, Math.round((s.count / maxVal) * maxH));
        return (
          <div key={s.status_id} className="flex flex-col items-center flex-1">
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ height: h, background: BAR_CHART_COLORS[i % BAR_CHART_COLORS.length] }}
            />
            <p className="text-lg font-bold text-slate-900 mt-1">{s.count}</p>
            <p className="text-[9px] text-slate-500 text-center leading-tight">
              {STATUS_NAMES[s.status_id] ?? `#${s.status_id}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [range,   setRange]   = useState<Range>('30D');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [drafts,  setDrafts]  = useState<ApiDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const [m, d] = await Promise.all([
        apiFetch<AdminMetrics>(`/api/reporting/admin/metrics?period=${RANGE_PERIOD[r]}`),
        apiFetch<ApiDraft[]>('/api/admin/drafts'),
      ]);
      setMetrics(m);
      setDrafts(d);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const m            = metrics?.metrics;
  const draftCount   = drafts.length;
  const activeCount  = m?.current_backlog ?? 0;
  const avgRes       = m?.avg_resolution_time_hours ?? 0;
  const assigneeList = m?.assignee_workload ?? [];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-red-500 text-sm flex-col gap-3">
        <p>{error}</p>
        <button
          onClick={() => fetchData(range)}
          className="text-xs px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="admin" userName="Admin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* Top bar */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-4">
              <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
              <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                {(['7D', '30D', '90D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                    style={{
                      background: range === r ? '#fff' : 'transparent',
                      color:      range === r ? '#0f172a' : '#64748b',
                      boxShadow:  range === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-8 py-4 space-y-5">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Draft Queue"      value={draftCount}                         sub="Need Reviews"     subColor="#ef4444" bgColor="#fef3c2" />
              <StatCard label="Active Tickets"   value={activeCount}                        sub="In Progress"      subColor="#6366f1" bgColor="#dbeafe" />
              <StatCard label="Avg Resolution"   value={avgRes > 0 ? `${avgRes}h` : '—'}   sub="Resolved tickets" subColor="#10b981" bgColor="#e9d5ff" />
              <StatCard label="Active Assignees" value={assigneeList.length}                sub="Team Members"     subColor="#64748b" bgColor="#ccfbf1" />
            </div>

            {/* ── Draft Queue ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Draft Queue — Action Required</h3>
                    <p className="text-xs text-slate-500">Submitted tickets pending admin review and approval</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/admin/draft')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View All Drafts
                </button>
              </div>

              {drafts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No pending submissions.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {drafts.slice(0, 5).map((t) => {
                    const req        = t.ticket_requests[0]?.request ?? null;
                    const sender     = req?.name ?? req?.email ?? '—';
                    const catStyle   = getCatStyle(t.category?.name ?? '');
                    const initials   = sender.slice(0, 2).toUpperCase();
                    return (
                      <div key={t.ticket_id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate max-w-40">{req?.email ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeAgo(t.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold text-slate-900 max-w-55 truncate">
                            {t.title ?? `Draft #${t.ticket_id}`}
                          </span>
                          {t.category && (
                            <span
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0"
                              style={{ background: catStyle.bg, color: catStyle.color }}
                            >
                              {t.category.name}
                            </span>
                          )}
                          <button
                            onClick={() => router.push(`/admin/review-ticket?id=${t.ticket_id}`)}
                            className="text-sm px-4 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-linear-to-b from-yellow-400 via-blue-400 to-purple-400 rounded-full" />
                  <span className="text-base font-bold text-slate-900">Ticket Volume by Status</span>
                </div>
                <StatusBarChart byStatus={m?.tickets_by_status ?? []} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-1">Category Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Top categories by ticket volume</p>
                <DonutChart
                  categories={m?.top_categories ?? []}
                  total={m?.total_tickets ?? 0}
                />
              </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Assignee Workload */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Assignee Workload</h3>
                  <button
                    onClick={() => router.push('/admin/user-management')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Manage Users →
                  </button>
                </div>
                <div className="space-y-3">
                  {assigneeList.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No assignees found.</p>
                  ) : assigneeList.slice(0, 5).map((a, i) => {
                    const statusLabel = a.active_tickets > 5 ? 'CRITICAL' : a.active_tickets > 0 ? 'ACTIVE' : 'IDLE';
                    const statusStyle = ASSIGNEE_STATUS_STYLE[statusLabel];
                    const initials    = a.assignee_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div key={a.assignee_id ?? i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 flex-1 truncate">{a.assignee_name}</p>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusLabel}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {a.active_tickets} ticket{a.active_tickets !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Status Overview</h3>
                  <button
                    onClick={() => router.push('/admin/tickets')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Draft',       ids: [1], color: '#d97706', bg: '#fffbeb' },
                    { label: 'New',         ids: [2], color: '#2563eb', bg: '#eff6ff' },
                    { label: 'In Progress', ids: [3, 4], color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Renew',       ids: [7], color: '#0369a1', bg: '#f0f9ff' },
                    { label: 'Solved',      ids: [5], color: '#15803d', bg: '#f0fdf4' },
                    { label: 'Failed',      ids: [6], color: '#b91c1c', bg: '#fef2f2' },
                  ].map((s) => {
                    const count = (m?.tickets_by_status ?? [])
                      .filter((ts) => s.ids.includes(ts.status_id))
                      .reduce((acc, ts) => acc + ts.count, 0);
                    return (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-slate-200" style={{ background: s.bg }}>
                        <p className="text-2xl font-bold leading-none" style={{ color: s.color }}>{count}</p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1">{s.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
