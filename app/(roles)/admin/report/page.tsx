'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/ReportTB';
import {
  STATUS_STYLES,
  type TicketStatus,
} from '@/lib/admin-dashboard-data';
import { apiFetch } from '@/lib/api-client';
import {
  type ApiMetrics,
  STATUS_ID_MAP,
  periodToApiParam,
  nameFallback,
} from './report-types';
import { TicketVolumeModal }        from './TicketVolumeModal';
import { BacklogSummaryModal }      from './BacklogSummaryModal';
import { PerformanceMetricsModal }  from './PerformanceMetricsModal';
import { CategoryBreakdownModal }   from './CategoryBreakdownModal';
import { AssigneePerformanceModal } from './AssigneePerformanceModal';
import { AIAccuracyModal }          from './AIAccuracyModal';
import {
  BarChart3, TrendingUp, Users, Bot,
  Layers, ChevronRight, FileEdit, Sparkles, UserCheck,
  Wrench, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];

const STATUS_LABELS: { status: TicketStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'draft',    label: 'Draft',    icon: <FileEdit size={14} />    },
  { status: 'new',      label: 'New',      icon: <Sparkles size={14} />    },
  { status: 'assigned', label: 'Assigned', icon: <UserCheck size={14} />   },
  { status: 'solving',  label: 'Solving',  icon: <Wrench size={14} />      },
  { status: 'solved',   label: 'Solved',   icon: <CheckCircle2 size={14} /> },
  { status: 'failed',   label: 'Failed',   icon: <XCircle size={14} />     },
  { status: 'renew',    label: 'Renew',    icon: <RefreshCw size={14} />   },
];

const REPORT_CARDS = [
  { id: 'ticket-volume',        title: 'Ticket Volume Report',  description: 'View ticket volume trends over time with daily, weekly, and monthly breakdowns.',           icon: <BarChart3 size={22} />,  accent: '#3B82F6', accentBg: '#EFF6FF' },
  { id: 'performance-metrics',  title: 'Performance Metrics',   description: 'Analyze resolution times, response rates, and team performance indicators.',                icon: <TrendingUp size={22} />, accent: '#8B5CF6', accentBg: '#F5F3FF' },
  { id: 'category-breakdown',   title: 'Category Breakdown',    description: 'Detailed breakdown of tickets by category, priority, and status distribution.',            icon: <Layers size={22} />,     accent: '#06B6D4', accentBg: '#ECFEFF' },
  { id: 'assignee-performance', title: 'Assignee Performance',  description: 'Compare team member performance, workload distribution, and efficiency metrics.',           icon: <Users size={22} />,      accent: '#F59E0B', accentBg: '#FFFBEB' },
  { id: 'backlog-summary',      title: 'Backlog Summary',       description: 'Monitor open ticket backlog by status and category.',                                       icon: <Layers size={22} />,     accent: '#6366F1', accentBg: '#EEF2FF' },
  { id: 'ai-accuracy',          title: 'AI Accuracy Report',    description: 'Monitor AI processing SLA compliance, suggestion acceptance, and category match accuracy.', icon: <Bot size={22} />,        accent: '#6366F1', accentBg: '#EEF2FF' },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period,      setPeriod]      = useState('Last 30 days');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [metrics,     setMetrics]     = useState<ApiMetrics | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    setMetrics(null);
    const param = periodToApiParam(period);
    const url   = param ? `/reporting/admin/metrics?period=${param}` : '/reporting/admin/metrics';
    apiFetch(url)
      .then((res: { metrics: ApiMetrics }) => setMetrics(res.metrics))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [period]);

  const openModal  = (id: string) => setActiveModal(id);
  const closeModal = ()           => setActiveModal(null);

  // ── Derived values from real API metrics ──────────────────────────────────
  const totalTickets   = metrics?.total_tickets ?? 0;
  const solvedTickets  = metrics?.tickets_by_status.find(s => s.status_id === 5)?.count ?? 0;
  const failedTickets  = metrics?.tickets_by_status.find(s => s.status_id === 6)?.count ?? 0;
  const backlogTickets = metrics?.current_backlog ?? 0;
  const avgResolution  = metrics?.avg_resolution_time_hours ?? 0;

  const statusCounts = useMemo<Partial<Record<TicketStatus, number>>>(() => {
    const map: Partial<Record<TicketStatus, number>> = {};
    metrics?.tickets_by_status.forEach(s => {
      const status = STATUS_ID_MAP[s.status_id] as TicketStatus | undefined;
      if (status) map[status] = s.count;
    });
    return map;
  }, [metrics]);

  const categoryBreakdown = useMemo(() => {
    if (!metrics) return [];
    return metrics.top_categories.map(c => ({
      name:  c.category_name,
      count: c.count,
      pct:   totalTickets > 0 ? Math.round((c.count / totalTickets) * 100) : 0,
    }));
  }, [metrics, totalTickets]);

  const assigneeWorkload = useMemo(() => {
    return (metrics?.assignee_workload ?? []).map(a => ({
      name:     a.assignee_name,
      fallback: nameFallback(a.assignee_name),
      role:     'Support',
      count:    a.active_tickets,
    })).sort((a, b) => b.count - a.count);
  }, [metrics]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 pb-8">

          {/* Period selector */}
          <div className="flex items-center justify-between mt-6 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reports Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading
                  ? 'Loading metrics…'
                  : `Showing ${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} for ${period.toLowerCase()}`}
              </p>
            </div>
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
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Tickets',      value: loading ? '—' : totalTickets,   sub: period.toLowerCase(),                                                                                              color: '#3B82F6' },
              { label: 'Solved',             value: loading ? '—' : solvedTickets,  sub: totalTickets > 0 ? `${Math.round((solvedTickets / totalTickets) * 100)}% resolution rate` : '0% resolution rate', color: '#10B981' },
              { label: 'Average Resolution', value: loading ? '—' : avgResolution > 0 ? `${avgResolution.toFixed(1)} hrs` : '—', sub: 'Per resolved ticket',                             color: '#8B5CF6' },
              { label: 'Backlog',            value: loading ? '—' : backlogTickets, sub: `${failedTickets} failed`,                                                                                        color: '#F43F5E' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1">
                <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: kpi.color }} />
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</span>
                <span className="text-sm font-semibold text-gray-700">{kpi.label}</span>
                <span className="text-xs text-gray-400">{kpi.sub}</span>
              </div>
            ))}
          </div>

          {/* Insight panels */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Status Distribution</h4>
              {totalTickets === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tickets in this period.</p>
              ) : (
                <div className="space-y-3">
                  {STATUS_LABELS.map(({ status, label, icon }) => {
                    const count = statusCounts[status] ?? 0;
                    const pct   = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
                    const style = STATUS_STYLES[status];
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: style.text }}>{icon}</span>
                            <span className="text-xs font-medium text-gray-700">{label}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-800">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: style.dot }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Top Categories</h4>
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tickets in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {categoryBreakdown.slice(0, 5).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                          <span className="text-xs text-gray-400">{cat.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-orange-400 transition-all duration-500" style={{ width: `${cat.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Assignee Workload</h4>
              {totalTickets === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tickets in this period.</p>
              ) : (
                <div className="space-y-3">
                  {assigneeWorkload.map((a) => (
                    <div key={a.name} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white text-[10px] font-bold">{a.fallback}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-800 truncate">{a.name}</span>
                          <span className="text-xs font-bold text-gray-600 ml-2">{a.count}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{a.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Cards */}
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Available Reports</h3>
          <div className="grid grid-cols-3 gap-4 items-stretch">
            {REPORT_CARDS.map((card) => (
              <div
                key={card.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.accentBg, color: card.accent }}>
                    {card.icon}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900">{card.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">Updated · Today</span>
                  <button
                    onClick={() => openModal(card.id)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-150 hover:opacity-80 active:scale-95"
                    style={{ color: card.accent, borderColor: `${card.accent}40`, background: card.accentBg }}
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* ── Modals ── */}
      <TicketVolumeModal
        open={activeModal === 'ticket-volume'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
      <PerformanceMetricsModal
        open={activeModal === 'performance-metrics'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
      <CategoryBreakdownModal
        open={activeModal === 'category-breakdown'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
      <AssigneePerformanceModal
        open={activeModal === 'assignee-performance'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
      <BacklogSummaryModal
        open={activeModal === 'backlog-summary'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
      <AIAccuracyModal
        open={activeModal === 'ai-accuracy'}
        onClose={closeModal}
        period={period}
        metrics={metrics}
      />
    </div>
  );
}