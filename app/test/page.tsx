'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/ReportTB';
import {
  DASHBOARD_TICKETS,
  DASHBOARD_ASSIGNEES,
  STATUS_STYLES,
  type TicketStatus,
  type DashboardAssignee,
} from '@/lib/admin-dashboard-data';
import { TicketVolumeModal } from '@/app/(roles)/admin/report/TicketVolumeModal';
import { BacklogSummaryModal } from '@/app/(roles)/admin/report/BacklogSummaryModal';
import { PerformanceMetricsModal } from '@/app/(roles)/admin/report/PerformanceMetricsModal';
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Bot,
  Layers,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Timer,
  Flame,
} from 'lucide-react';

// ─── Period filter helper ─────────────────────────────────────────────────────

function periodToCutoff(p: string): number {
  const now = Date.now();
  switch (p) {
    case 'Last 7 days':  return now - 7  * 24 * 60 * 60 * 1000;
    case 'Last 30 days': return now - 30 * 24 * 60 * 60 * 1000;
    case 'Last 90 days': return now - 90 * 24 * 60 * 60 * 1000;
    case 'This year':    return new Date(new Date().getFullYear(), 0, 1).getTime();
    default:             return 0;
  }
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];

const STATUS_LABELS: { status: TicketStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'submitted',   label: 'Submitted',  icon: <AlertCircle size={14} /> },
  { status: 'in-progress', label: 'In Progress', icon: <Timer size={14} /> },
  { status: 'resolved',    label: 'Resolved',    icon: <CheckCircle2 size={14} /> },
  { status: 'critical',    label: 'Critical',    icon: <Flame size={14} /> },
];

const REPORT_CARDS = [
  {
    id: 'ticket-volume',
    title: 'Ticket Volume Report',
    description: 'View ticket volume trends over time with daily, weekly, and monthly breakdowns.',
    icon: <BarChart3 size={22} />,
    accent: '#3B82F6',
    accentBg: '#EFF6FF',
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Analyze resolution times, response rates, and team performance indicators.',
    icon: <TrendingUp size={22} />,
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
  },
  {
    id: 'category-breakdown',
    title: 'Category Breakdown',
    description: 'Detailed breakdown of tickets by category, priority, and status distribution.',
    icon: <Layers size={22} />,
    accent: '#06B6D4',
    accentBg: '#ECFEFF',
  },
  {
    id: 'assignee-performance',
    title: 'Assignee Performance',
    description: 'Compare team member performance, workload distribution, and efficiency metrics.',
    icon: <Users size={22} />,
    accent: '#F59E0B',
    accentBg: '#FFFBEB',
  },
  {
    id: 'backlog-summary',
    title: 'Backlog Summary',
    description: 'Monitor open ticket backlog by status and category.',
    icon: <Layers size={22} />,
    accent: '#6366F1',
    accentBg: '#EEF2FF',
  },
  {
    id: 'ai-accuracy',
    title: 'AI Accuracy Report',
    description: 'Measure AI suggestion accuracy, acceptance rates, and improvement areas.',
    icon: <Bot size={22} />,
    accent: '#6366F1',
    accentBg: '#EEF2FF',
  },
  {
    id: 'export-data',
    title: 'Export Data',
    description: 'Export ticket data and reports in various formats (CSV, Excel, PDF).',
    icon: <Download size={22} />,
    accent: '#64748B',
    accentBg: '#F8FAFC',
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod]           = useState('Last 30 days');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal  = (id: string) => setActiveModal(id);
  const closeModal = ()           => setActiveModal(null);

  // ── Filter tickets by selected period ──────────────────────────────────────
  const filteredTickets = useMemo(() => {
    const cutoff = periodToCutoff(period);
    return DASHBOARD_TICKETS.filter((t) => new Date(t.date).getTime() >= cutoff);
  }, [period]);

  // ── KPI stats — all derived from filteredTickets ───────────────────────────
  const totalTickets    = filteredTickets.length;
  const resolvedTickets = filteredTickets.filter((t) => t.status === 'resolved').length;
  const criticalTickets = filteredTickets.filter((t) => t.status === 'critical').length;
  const backlogTickets  = filteredTickets.filter(
    (t) => t.status === 'submitted' || t.status === 'in-progress',
  ).length;

  // ── Category breakdown — filtered ─────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map = filteredTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
      }));
  }, [filteredTickets, totalTickets]);

  // ── Assignee workload — filtered ───────────────────────────────────────────
  const assigneeWorkload = useMemo(() => {
    const map = filteredTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.assignee.name] = (acc[t.assignee.name] ?? 0) + 1;
      return acc;
    }, {});
    return DASHBOARD_ASSIGNEES.map((a: DashboardAssignee) => ({
      ...a,
      count: map[a.name] ?? 0,
    })).sort((a, b) => b.count - a.count);
  }, [filteredTickets]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar userRole="admin" userName="Palm Pollapat" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 pb-8">

          {/* Period selector */}
          <div className="flex items-center justify-between mt-6 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reports Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Showing {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} for {period.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Period</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Cards — filtered */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Total Tickets',
                value: totalTickets,
                sub: period.toLowerCase(),
                color: '#3B82F6',
              },
              {
                label: 'Resolved',
                value: resolvedTickets,
                sub: totalTickets > 0
                  ? `${Math.round((resolvedTickets / totalTickets) * 100)}% resolution rate`
                  : '0% resolution rate',
                color: '#10B981',
              },
              {
                label: 'Average Resolution',
                value: '3.2 hrs',
                sub: 'Per ticket',
                color: '#8B5CF6',
              },
              {
                label: 'Backlog',
                value: backlogTickets,
                sub: `${criticalTickets} critical`,
                color: '#F43F5E',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1"
              >
                <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: kpi.color }} />
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {kpi.value}
                </span>
                <span className="text-sm font-semibold text-gray-700">{kpi.label}</span>
                <span className="text-xs text-gray-400">{kpi.sub}</span>
              </div>
            ))}
          </div>

          {/* Insight panels — filtered */}
          <div className="grid grid-cols-3 gap-4 mb-6">

            {/* Status distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Status Distribution</h4>
              {totalTickets === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tickets in this period.</p>
              ) : (
                <div className="space-y-3">
                  {STATUS_LABELS.map(({ status, label, icon }) => {
                    const count = filteredTickets.filter((t) => t.status === status).length;
                    const pct   = Math.round((count / totalTickets) * 100);
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
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: style.dot }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category breakdown */}
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
                          <div
                            className="h-full rounded-full bg-orange-400 transition-all duration-500"
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignee workload */}
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
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">
            Available Reports
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {REPORT_CARDS.map((card) => (
              <div
                key={card.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: card.accentBg, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200 mt-1"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{card.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">Updated · Today</span>
                  <button
                    onClick={() => openModal(card.id)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-150 hover:opacity-80 active:scale-95"
                    style={{
                      color: card.accent,
                      borderColor: `${card.accent}40`,
                      background: card.accentBg,
                    }}
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
      />
      <PerformanceMetricsModal
        open={activeModal === 'performance-metrics'}
        onClose={closeModal}
        period={period}
      />
      <BacklogSummaryModal
        open={activeModal === 'backlog-summary'}
        onClose={closeModal}
        period={period}
      />
    </div>
  );
}