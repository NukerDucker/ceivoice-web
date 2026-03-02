'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/PerformanceTB';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTicket {
  ticket_id: number;
  title: string;
  summary: string;
  priority: string;
  deadline: string | null;
  resolved_at: string | null;
  updated_at: string;
  created_at: string;
  status?: { name: string };
  category?: { name: string };
}

interface WorkloadResponse {
  assignee_id: string;
  workload: {
    total_active_tickets: number;
    status_breakdown: Record<string, number>;
    upcoming_deadlines_count: number;
    overdue_count: number;
  };
  tickets: ApiTicket[];
}

interface PerformanceResponse {
  assignee_id: string;
  period: string;
  performance: {
    total_solved: number;
    total_failed: number;
    success_rate: string;
    avg_resolution_time_hours: number | null;
    resolved_by_category: { category_name: string; count: number }[];
  };
}

// ─── Priority styles ─────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fee2e2', color: '#b91c1c' },
  critical: { bg: '#fee2e2', color: '#b91c1c' },
  High:     { bg: '#fef3c2', color: '#92400e' },
  high:     { bg: '#fef3c2', color: '#92400e' },
  Medium:   { bg: '#e0f2fe', color: '#0369a1' },
  medium:   { bg: '#e0f2fe', color: '#0369a1' },
  Low:      { bg: '#f0fdf4', color: '#166534' },
  low:      { bg: '#f0fdf4', color: '#166534' },
};

// ─── Period helpers ───────────────────────────────────────────────────────────

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'] as const;

/** Map display label → API query value */
function periodToApiParam(p: string): string {
  switch (p) {
    case 'Last 7 days':  return 'last_7_days';
    case 'Last 30 days': return 'last_30_days';
    case 'Last 90 days': return 'last_90_days';
    case 'This year':    return 'this_year';
    default:             return 'last_30_days';
  }
}

/** Map display label → cutoff timestamp for client-side filtering of resolved list */
function periodToCutoff(p: string): number {
  const now = Date.now();
  switch (p) {
    case 'Last 7 days':  return now - 7  * 86_400_000;
    case 'Last 30 days': return now - 30 * 86_400_000;
    case 'Last 90 days': return now - 90 * 86_400_000;
    case 'This year':    return new Date(new Date().getFullYear(), 0, 1).getTime();
    default:             return 0;
  }
}

function deadlineLabel(iso: string): { text: string; urgent: boolean } {
  const h = (new Date(iso).getTime() - Date.now()) / 3_600_000;
  if (h < 0)  return { text: 'Overdue',                urgent: true  };
  if (h < 6)  return { text: `${Math.round(h)}h left`, urgent: true  };
  if (h < 24) return { text: `${Math.round(h)}h left`, urgent: false };
  return       { text: `${Math.floor(h / 24)}d left`,  urgent: false };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssigneePerformancePage() {
  const [period, setPeriod] = useState('Last 30 days');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // Data from API
  const [userName, setUserName]         = useState('');
  const [activeTickets, setActiveTickets] = useState<ApiTicket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<ApiTicket[]>([]);
  const [perfData, setPerfData]         = useState<PerformanceResponse['performance'] | null>(null);

  // ── Fetch user name from Supabase ──────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setUserName(
          u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? '',
        );
      }
    });
  }, []);

  // ── Fetch workload (active tickets) – once on mount ────────────────────────
  useEffect(() => {
    apiFetch<WorkloadResponse>('/reporting/assignee/workload')
      .then((res) => setActiveTickets(res.tickets ?? []))
      .catch((err) => console.error('workload fetch failed:', err));
  }, []);

  // ── Fetch resolved tickets – once on mount ─────────────────────────────────
  useEffect(() => {
    apiFetch<ApiTicket[]>('/tickets/assigned?resolved=true')
      .then((list) => setResolvedTickets(list ?? []))
      .catch((err) => console.error('resolved fetch failed:', err));
  }, []);

  // ── Fetch performance metrics when period changes ──────────────────────────
  const fetchPerformance = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PerformanceResponse>(
        `/reporting/assignee/performance?period=${periodToApiParam(p)}`,
      );
      setPerfData(res.performance);
    } catch (err) {
      console.error('performance fetch failed:', err);
      setError('Failed to load performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPerformance(period); }, [period, fetchPerformance]);

  // ── Filter resolved list by selected period (client-side) ──────────────────
  const cutoff = periodToCutoff(period);
  const resolvedInPeriod = useMemo(
    () =>
      resolvedTickets.filter((t) => {
        const ts = t.resolved_at ?? t.updated_at;
        return new Date(ts).getTime() >= cutoff;
      }),
    [resolvedTickets, cutoff],
  );

  const solvedCount = perfData?.total_solved ?? resolvedInPeriod.filter((t) => t.status?.name === 'Solved').length;
  const failedCount = perfData?.total_failed ?? resolvedInPeriod.filter((t) => t.status?.name === 'Failed').length;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && !perfData) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading performance data…</span>
        </main>
      </div>
    );
  }

  if (error && !perfData) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 pb-8">

          {/* Header row */}
          <div className="flex items-center justify-between mt-6 mb-5">
            <p className="text-sm text-gray-500">
              {userName || '—'}
            </p>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Period</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1">
              <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: '#3B82F6' }} />
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {activeTickets.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">Active Tickets</span>
              <span className="text-xs text-gray-400">Currently assigned to you</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1">
              <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: '#10B981' }} />
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {solvedCount + failedCount}
              </span>
              <span className="text-sm font-semibold text-gray-700">Resolved</span>
              <span className="text-xs text-gray-400">{period.toLowerCase()}</span>
            </div>
          </div>

          {/* Detail tables */}
          <div className="grid grid-cols-2 gap-6">

            {/* Active ticket list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">
                Current Workload
                <span className="ml-2 text-xs font-semibold text-gray-400">({activeTickets.length})</span>
              </h4>
              {activeTickets.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No active tickets.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeTickets.map((t) => {
                    const dl = t.deadline ? deadlineLabel(t.deadline) : null;
                    const pStyle = PRIORITY_STYLE[t.priority] ?? { bg: '#f3f4f6', color: '#6b7280' };
                    return (
                      <div key={t.ticket_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">#{t.ticket_id}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                          <p className="text-[10px] text-gray-400">{t.category?.name ?? '—'}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: pStyle.bg, color: pStyle.color }}
                        >
                          {t.priority.toUpperCase()}
                        </span>
                        {dl && (
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 shrink-0 ${dl.urgent ? 'text-red-500' : 'text-gray-400'}`}>
                            {dl.urgent && <AlertTriangle size={9} />}
                            <Clock size={9} />
                            {dl.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolved ticket list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">
                Resolved in Period
                <span className="ml-2 text-xs font-semibold text-gray-400">({resolvedInPeriod.length})</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-base font-extrabold text-green-700">{solvedCount}</p>
                    <p className="text-[10px] text-green-600">Solved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <XCircle size={14} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-base font-extrabold text-red-600">{failedCount}</p>
                    <p className="text-[10px] text-red-500">Failed</p>
                  </div>
                </div>
              </div>

              {resolvedInPeriod.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No resolved tickets in this period.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {resolvedInPeriod.map((t) => {
                    const statusName = t.status?.name ?? '';
                    const isSolved = statusName === 'Solved';
                    return (
                      <div key={t.ticket_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">#{t.ticket_id}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                          <p className="text-[10px] text-gray-400">{t.category?.name ?? '—'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSolved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {statusName.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
    </div>
  );
}