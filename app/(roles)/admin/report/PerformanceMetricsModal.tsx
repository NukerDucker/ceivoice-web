"use client";

import React, { useMemo, useState } from "react";
import { X, Download, TrendingUp } from "lucide-react";
import { DASHBOARD_TICKETS } from "@/lib/admin-dashboard-data";
import type { TicketPriority } from "@/lib/admin-dashboard-data";

// ─── Period helper ────────────────────────────────────────────────────────────

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

function periodToCutoff(p: string): number {
  const now = Date.now();
  switch (p) {
    case "Last 7 days":  return now - 7  * 24 * 60 * 60 * 1000;
    case "Last 30 days": return now - 30 * 24 * 60 * 60 * 1000;
    case "Last 90 days": return now - 90 * 24 * 60 * 60 * 1000;
    case "This year":    return new Date(new Date().getFullYear(), 0, 1).getTime();
    default:             return 0;
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number): string {
  return n.toFixed(1);
}

function perfBadge(rate: number): { label: string; bg: string; color: string; border: string } {
  if (rate >= 90) return { label: "EXCELLENT", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" };
  if (rate >= 75) return { label: "GOOD",      bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" };
  if (rate >= 60) return { label: "FAIR",      bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" };
  return               { label: "POOR",      bg: "#FFF1F2", color: "#BE123C", border: "#FCA5A5" };
}

const PRIORITY_ORDER: TicketPriority[] = ["critical", "high", "medium", "low"];
const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: "#F87171",
  high:     "#FBBF24",
  medium:   "#60A5FA",
  low:      "#34D399",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerformanceMetricsModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  // Sync local period whenever the parent period changes
  React.useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── Filter tickets by period ───────────────────────────────────────────────
  const tickets = useMemo(() => {
    const cutoff = periodToCutoff(localPeriod);
    return DASHBOARD_TICKETS.filter((t) => new Date(t.date).getTime() >= cutoff);
  }, [localPeriod]);

  // ── KPI derivations ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total    = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved");

    const avgResolution   = avg(resolved.map((t) => t.resolutionHours ?? 0));
    const avgFirstResp    = avg(tickets.map((t) => t.firstResponseHours));
    const resolutionRate  = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
    const slaCompliant    = tickets.filter((t) => !t.slaBreached).length;
    const slaCompliance   = total > 0 ? Math.round((slaCompliant / total) * 100) : 0;

    return { avgResolution, avgFirstResp, resolutionRate, slaCompliance };
  }, [tickets]);

  // ── Category table ────────────────────────────────────────────────────────
  const categoryRows = useMemo(() => {
    const map: Record<string, { all: typeof tickets; resolved: typeof tickets }> = {};

    tickets.forEach((t) => {
      if (!map[t.category]) map[t.category] = { all: [], resolved: [] };
      map[t.category].all.push(t);
      if (t.status === "resolved") map[t.category].resolved.push(t);
    });

    return Object.entries(map)
      .map(([category, { all, resolved }]) => {
        const resRate  = all.length > 0 ? Math.round((resolved.length / all.length) * 100) : 0;
        const avgRes   = avg(resolved.map((t) => t.resolutionHours ?? 0));
        return { category, totalTickets: all.length, avgRes, resRate };
      })
      .sort((a, b) => b.totalTickets - a.totalTickets);
  }, [tickets]);

  // ── Priority bars ─────────────────────────────────────────────────────────
  const priorityRows = useMemo(() => {
    return PRIORITY_ORDER.map((priority) => {
      const group   = tickets.filter((t) => t.priority === priority && t.resolutionHours !== undefined);
      const avgRes  = avg(group.map((t) => t.resolutionHours!));
      return { priority, avgRes, count: group.length };
    }).filter((r) => r.count > 0);
  }, [tickets]);

  // Max hours for bar width scaling
  const maxPriorityHours = Math.max(...priorityRows.map((r) => r.avgRes), 1);

  const now          = new Date();
  const updatedLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {localPeriod} &bull; Updated today at {updatedLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Period + Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Period :</span>
              <select
                value={localPeriod}
                onChange={(e) => setLocalPeriod(e.target.value)}
                className="text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg px-4 py-1.5 hover:bg-blue-50 transition-colors">
              <Download size={14} />
              Export Report
            </button>
          </div>

          {/* ── KPI Cards ── */}
          {tickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tickets in this period.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: "Average resolution time",
                    value: kpis.avgResolution > 0 ? `${round1(kpis.avgResolution)}h` : "—",
                    sub: "Resolved tickets only",
                    subColor: "#8B5CF6",
                  },
                  {
                    label: "First response time",
                    value: `${round1(kpis.avgFirstResp)}h`,
                    sub: "Across all tickets",
                    subColor: "#3B82F6",
                  },
                  {
                    label: "Resolution Rate",
                    value: `${kpis.resolutionRate}%`,
                    sub: `${tickets.filter((t) => t.status === "resolved").length} of ${tickets.length} resolved`,
                    subColor: "#10B981",
                  },
                  {
                    label: "SLA Compliance",
                    value: `${kpis.slaCompliance}%`,
                    sub: `${tickets.filter((t) => t.slaBreached).length} breach${tickets.filter((t) => t.slaBreached).length !== 1 ? "es" : ""}`,
                    subColor: kpis.slaCompliance >= 90 ? "#10B981" : "#F43F5E",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-xl border border-gray-100 p-4 flex flex-col gap-1 bg-white shadow-sm"
                  >
                    <span className="text-xs text-gray-500">{kpi.label}</span>
                    <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                    <span className="text-xs font-semibold" style={{ color: kpi.subColor }}>
                      {kpi.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Performance by Category ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Performance by Category</h3>
                </div>
                {categoryRows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No data available.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {["Category", "Total Tickets", "Avg Resolution", "Resolution Rate", "Performance"].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {categoryRows.map((row) => {
                        const badge = perfBadge(row.resRate);
                        return (
                          <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-gray-800">{row.category}</td>
                            <td className="px-5 py-3.5 text-gray-600">{row.totalTickets}</td>
                            <td className="px-5 py-3.5 text-gray-600">
                              {row.avgRes > 0 ? `${round1(row.avgRes)}h` : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600">{row.resRate}%</td>
                            <td className="px-5 py-3.5">
                              <span
                                className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                                style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                              >
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── Average Resolution Time by Priority ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">
                  Average Resolution Time by Priority
                </h3>
                {priorityRows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No resolved tickets in this period.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {priorityRows.map((row) => (
                      <div key={row.priority}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {row.priority}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {round1(row.avgRes)} hours
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((row.avgRes / maxPriorityHours) * 100)}%`,
                              background: PRIORITY_COLORS[row.priority],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}