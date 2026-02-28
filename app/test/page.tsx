"use client";

import React, { useState, useMemo } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/layout/AssigneeSidebar";
import { Header } from "@/components/layout/Navbar";
import {
  MY_ACTIVE_TICKETS,
  MY_RESOLVED_TICKETS,
  ASSIGNEE_PERFORMANCE,
  CURRENT_ASSIGNEE,
  getCatStyle,
  PRIORITY_STYLE,
  STATUS_STYLES,
  type AssigneeTicket,
} from "@/lib/assignee-dashboard-data";
import { TicketDetailModal, STATUS_LABEL, timeAgo, timeUntil } from "../(roles)/assignee/dashboard/Ticketdetailmodal";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, subColor, bgColor,
}: {
  label: string; value: string | number; sub: string;
  subColor: string; bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bgColor }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AssigneeDashboardPage() {
  const [tickets, setTickets]               = useState<AssigneeTicket[]>(MY_ACTIVE_TICKETS);
  const [sortBy, setSortBy]                 = useState<"deadline" | "priority">("deadline");
  const [selectedTicket, setSelectedTicket] = useState<AssigneeTicket | null>(null);

  const activeTickets = useMemo(() => {
    return [...tickets]
      .filter((t) => t.status !== "solved" && t.status !== "failed")
      .sort((a, b) => {
        if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
  }, [tickets, sortBy]);

  const handleTicketUpdate = (ticketId: string, updates: Partial<AssigneeTicket>) => {
    setTickets((prev) => prev.map((t) => t.ticketId === ticketId ? { ...t, ...updates } : t));
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, ...updates } : prev);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar ── */}
      <div className="flex flex-col h-screen shrink-0">
        <Sidebar userName={CURRENT_ASSIGNEE.name} />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Header />

          <div className="px-8 py-6 space-y-5">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="My Active Tickets"  value={ASSIGNEE_PERFORMANCE.activeCount}       sub="Currently assigned to you"  subColor="#6366f1" bgColor="#dbeafe" />
              <StatCard label="Critical / Urgent"  value={ASSIGNEE_PERFORMANCE.criticalCount}     sub="Need immediate action"      subColor="#ef4444" bgColor="#fef3c2" />
              <StatCard label="Resolved (30 days)" value={ASSIGNEE_PERFORMANCE.closedLast30}      sub={`${ASSIGNEE_PERFORMANCE.solvedLast30} solved · ${ASSIGNEE_PERFORMANCE.failedLast30} failed`} subColor="#10b981" bgColor="#dcfce7" />
              <StatCard label="Avg Response Time"  value={`${ASSIGNEE_PERFORMANCE.avgFirstResponseHours}h`} sub="First response average"  subColor="#10b981" bgColor="#e9d5ff" />
            </div>

            {/* ── Active Workload ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <ClipboardList size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Active Workload</h3>
                    <p className="text-xs text-slate-500">Your open tickets sorted by urgency — solved & failed excluded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                  <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    {([{ key: "deadline", label: "Deadline" }, { key: "priority", label: "Priority" }] as const).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                        style={{
                          background: sortBy === opt.key ? "#fff" : "transparent",
                          color:      sortBy === opt.key ? "#0f172a" : "#64748b",
                          boxShadow:  sortBy === opt.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeTickets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm font-semibold text-slate-500">All caught up! No active tickets.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeTickets.map((t) => {
                    const cs       = getCatStyle(t.category);
                    const st       = STATUS_STYLES[t.status];
                    const pr       = PRIORITY_STYLE[t.priority];
                    const timeLeft = timeUntil(t.deadline);
                    return (
                      <div
                        key={t.ticketId}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedTicket(t)}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pr.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400">{t.ticketId}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>
                              {t.category}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {t.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Opened {timeAgo(t.date)}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-center">
                          <p className="text-[10px] text-slate-400 mb-1">Time remaining</p>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${timeLeft.urgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                            {timeLeft.urgent && "⚠ "}{timeLeft.label}
                          </span>
                        </div>
                        <div className="shrink-0 flex flex-col items-center">
                          <p className="text-[10px] text-slate-400 mb-1">Status</p>
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: st.bg, color: st.text }}>
                            {STATUS_LABEL[t.status]}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Personal Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">My Performance (30 days)</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Total Volume", value: ASSIGNEE_PERFORMANCE.totalAssigned, color: "#6366f1", bg: "#eef2ff" },
                    { label: "Resolved",     value: ASSIGNEE_PERFORMANCE.solvedLast30,  color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Failed",       value: ASSIGNEE_PERFORMANCE.failedLast30,  color: "#ef4444", bg: "#fef2f2" },
                    { label: "In Progress",  value: ASSIGNEE_PERFORMANCE.activeCount,   color: "#f59e0b", bg: "#fffbeb" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 border border-slate-100" style={{ background: s.bg }}>
                      <p className="text-3xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">Resolution Rate</span>
                    <span className="font-bold text-slate-700">{ASSIGNEE_PERFORMANCE.resolutionRatePct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${ASSIGNEE_PERFORMANCE.resolutionRatePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Last 30 days</span>
                </div>
                <div className="space-y-3">
                  {MY_RESOLVED_TICKETS.map((t, i) => {
                    const st = STATUS_STYLES[t.status];
                    const cs = getCatStyle(t.category);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: st.bg }}>
                          <span style={{ color: st.text }}>{t.status === "solved" ? "✓" : "✗"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>
                              {t.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo(t.resolvedDate)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.text }}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Ticket Detail Modal ── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={CURRENT_ASSIGNEE}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  );
}