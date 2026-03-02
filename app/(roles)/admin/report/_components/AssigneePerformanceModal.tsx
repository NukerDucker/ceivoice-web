"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Download, Users } from "lucide-react";
import { type ApiMetrics, nameFallback } from '@/types/api';

// ─── Period helper ────────────────────────────────────────────────────────────

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function workloadLabel(open: number): string {
  if (open >= 4) return "High";
  if (open >= 2) return "Medium";
  return "Low";
}

function workloadColor(open: number): { color: string; bg: string } {
  if (open >= 4) return { color: "#B91C1C", bg: "#FEF2F2" };
  if (open >= 2) return { color: "#D97706", bg: "#FFFBEB" };
  return               { color: "#15803D", bg: "#F0FDF4" };
}

// Rank badge colours
const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#CD7C2F"];
const RANK_BG     = ["#FFFBEB", "#F9FAFB", "#FFF7ED"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
  metrics: ApiMetrics | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssigneePerformanceModal({ open, onClose, period: externalPeriod, metrics }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── Per-assignee stats from metrics.assignee_workload ────────────────────
  const assigneeRows = useMemo(() => {
    return (metrics?.assignee_workload ?? []).map((a) => ({
      name:        a.assignee_name,
      fallback:    nameFallback(a.assignee_name),
      openTickets: a.active_tickets,
    })).sort((a, b) => b.openTickets - a.openTickets);
  }, [metrics]);

  // ── Top 3 by workload ──────────────────────────────────────────────────────────────
  const topPerformers = assigneeRows.slice(0, 3);

  // ── Bar chart max values ──────────────────────────────────────────────────────────
  const maxActive = Math.max(...assigneeRows.map((r) => r.openTickets), 1);

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
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Users size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Assignee Performance</h2>
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
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg px-4 py-1.5 hover:bg-blue-50 transition-colors">
              <Download size={14} />
              Export Report
            </button>
          </div>

          {assigneeRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No assignee data available.</p>
          ) : (
            <>
              {/* ── Top by Workload ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Most Active Assignees</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {topPerformers.map((row, i) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ background: `${RANK_BG[i]}` }}
                    >
                      {/* Rank badge */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                        style={{ background: RANK_COLORS[i] }}
                      >
                        {i + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                        {row.fallback}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900">{row.name}</span>
                      </div>

                      {/* Active tickets */}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: RANK_BG[i], color: RANK_COLORS[i], border: `1px solid ${RANK_COLORS[i]}40` }}
                      >
                        {row.openTickets} active ticket{row.openTickets !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Active Tickets bar chart ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-800 mb-4">Active Tickets by Assignee</h4>
                <div className="space-y-3">
                  {assigneeRows.map((row) => (
                    <div key={row.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 truncate max-w-[160px]">{row.name}</span>
                        <span className="text-xs font-bold text-gray-800 ml-2">{row.openTickets}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((row.openTickets / maxActive) * 100)}%`,
                            background: "#F59E0B",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Detailed Breakdown ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Assignee Workload Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Assignee", "Active Tickets", "Workload"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assigneeRows.map((row) => {
                      const wl = workloadColor(row.openTickets);
                      return (
                        <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                          {/* Assignee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-[10px] shrink-0">
                                {row.fallback}
                              </div>
                              <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{row.name}</span>
                            </div>
                          </td>
                          {/* Active Tickets */}
                          <td className="px-4 py-3.5 text-xs text-gray-700 font-medium">{row.openTickets}</td>
                          {/* Workload */}
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: wl.bg, color: wl.color }}
                            >
                              {workloadLabel(row.openTickets)} ({row.openTickets})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}