"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, TrendingUp } from "lucide-react";
import { type ApiMetrics, STATUS_NAME_TO_ID, periodToApiParam } from '@/types/api';
import { apiFetch } from '@/lib/api-client';

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

function round1(n: number): string {
  return n.toFixed(1);
}

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
  metrics: ApiMetrics | null;
}

export function PerformanceMetricsModal({ open, onClose, period: externalPeriod, metrics: initialMetrics }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);
  const [localMetrics, setLocalMetrics] = useState<ApiMetrics | null>(initialMetrics);
  const [fetching, setFetching] = useState(false);

  useEffect(() => { setLocalPeriod(externalPeriod); }, [externalPeriod]);
  useEffect(() => { setLocalMetrics(initialMetrics); }, [initialMetrics]);

  // Refetch when period changes inside the modal
  useEffect(() => {
    if (!open) return;
    async function load() {
      setFetching(true);
      const param = periodToApiParam(localPeriod);
      const url   = param ? `/reporting/admin/metrics?period=${param}` : '/reporting/admin/metrics';
      try {
        const res = await apiFetch<{ metrics: ApiMetrics }>(url);
        setLocalMetrics(res.metrics);
      } catch {
        setLocalMetrics(null);
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [open, localPeriod]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const metrics = localMetrics;

  const kpis = useMemo(() => {
    if (!metrics) return null;
    const total          = metrics.total_tickets;
    const solvedStatusId = STATUS_NAME_TO_ID['Solved'] ?? 5;
    const solvedCount    = metrics.tickets_by_status.find((s) => s.status_id === solvedStatusId)?.count ?? 0;
    const avgResolution  = metrics.avg_resolution_time_hours;
    const resolutionRate = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
    return { avgResolution, resolutionRate, solvedCount, total };
  }, [metrics]);

  const categoryRows = useMemo(() => {
    return (metrics?.top_categories ?? []).map((c) => ({
      category:     c.category_name,
      totalTickets: c.count,
    }));
  }, [metrics]);

  const updatedLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — bottom sheet on mobile, centered card on sm+ */}
      <div className="relative bg-white w-full max-w-3xl flex flex-col rounded-t-2xl max-h-[92dvh] sm:rounded-2xl sm:shadow-2xl sm:max-h-[90vh]">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-3 sm:pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Performance Metrics</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {localPeriod} &bull; Updated today at {updatedLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

          {/* Period */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Period :</span>
            <select
              value={localPeriod}
              onChange={(e) => setLocalPeriod(e.target.value)}
              className="text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer"
            >
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {fetching ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : !kpis ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available for this period.</p>
          ) : (
            <>
              {/* KPI Cards — 1 col on mobile, 2 col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Performance by Category */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Performance by Category</h3>
                </div>

                {categoryRows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No data available.</p>
                ) : (
                  <>
                    {/* Mobile card list */}
                    <div className="sm:hidden divide-y divide-gray-100">
                      {categoryRows.map((row) => (
                        <div key={row.category} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">{row.category}</span>
                          <span className="text-sm text-gray-500 font-semibold">{row.totalTickets} tickets</span>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <table className="hidden sm:table w-full text-sm">
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
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}