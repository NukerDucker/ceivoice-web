"use client";

import React, { useMemo, useState } from "react";
import { X, Download, TrendingUp } from "lucide-react";
import { type ApiMetrics, STATUS_NAME_TO_ID } from './report-types';

// ─── Period helper ────────────────────────────────────────────────────────────

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

function round1(n: number): string {
  return n.toFixed(1);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
  metrics: ApiMetrics | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerformanceMetricsModal({ open, onClose, period: externalPeriod, metrics }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  // Sync local period whenever the parent period changes
  React.useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── KPI derivations from API metrics ─────────────────────────────────────
  const kpis = useMemo(() => {
    if (!metrics) return null;
    const total          = metrics.total_tickets;
    const solvedStatusId = STATUS_NAME_TO_ID['solved'] ?? 5;
    const solvedCount    = metrics.tickets_by_status.find((s) => s.status_id === solvedStatusId)?.count ?? 0;
    const avgResolution  = metrics.avg_resolution_time_hours;
    const resolutionRate = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
    return { avgResolution, resolutionRate, solvedCount, total };
  }, [metrics]);

  // ── Category table from top_categories ───────────────────────────────────
  const categoryRows = useMemo(() => {
    return (metrics?.top_categories ?? []).map((c) => ({
      category:     c.category_name,
      totalTickets: c.count,
    }));
  }, [metrics]);

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
          {!kpis ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available for this period.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Average resolution time",
                    value: kpis.avgResolution > 0 ? `${round1(kpis.avgResolution)}h` : "—",
                    sub: "Resolved tickets only",
                    subColor: "#8B5CF6",
                  },
                  {
                    label: "Resolution Rate",
                    value: `${kpis.resolutionRate}%`,
                    sub: `${kpis.solvedCount} of ${kpis.total} resolved`,
                    subColor: "#10B981",
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
                        {["Category", "Total Tickets"].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {categoryRows.map((row) => (
                        <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-800">{row.category}</td>
                          <td className="px-5 py-3.5 text-gray-600">{row.totalTickets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}