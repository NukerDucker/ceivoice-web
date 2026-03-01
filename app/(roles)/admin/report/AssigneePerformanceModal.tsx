"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Download, Users } from "lucide-react";
import { DASHBOARD_TICKETS, DASHBOARD_ASSIGNEES } from "@/lib/admin-dashboard-data";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (rate >= 60) return { label: "AVERAGE",   bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" };
  return               { label: "POOR",      bg: "#FFF1F2", color: "#BE123C", border: "#FCA5A5" };
}

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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssigneePerformanceModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── Filter tickets by period ───────────────────────────────────────────────
  const tickets = useMemo(() => {
    const cutoff = periodToCutoff(localPeriod);
    return DASHBOARD_TICKETS.filter((t) => new Date(t.date).getTime() >= cutoff);
  }, [localPeriod]);

  // ── Per-assignee stats ────────────────────────────────────────────────────
  const assigneeRows = useMemo(() => {
    return DASHBOARD_ASSIGNEES.map((a) => {
      const mine     = tickets.filter((t) => t.assignee.name === a.name);
      const resolved = mine.filter((t) => t.status === "resolved");
      const open     = mine.filter((t) => t.status !== "resolved").length;

      const assigned    = mine.length;
      const resolvedCnt = resolved.length;
      const successRate = assigned > 0 ? Math.round((resolvedCnt / assigned) * 100) : 0;
      const avgRes      = avg(resolved.map((t) => t.resolutionHours ?? 0));

      return {
        assignee:    a,
        assigned,
        resolved:    resolvedCnt,
        successRate,
        avgRes,
        openTickets: open,
      };
    }).sort((a, b) => b.successRate - a.successRate);
  }, [tickets]);

  // ── Top 3 performers ──────────────────────────────────────────────────────
  const topPerformers = assigneeRows.slice(0, 3);

  // ── Bar chart max values ──────────────────────────────────────────────────
  const maxResolved = Math.max(...assigneeRows.map((r) => r.resolved), 1);
  const maxAvgRes   = Math.max(...assigneeRows.map((r) => r.avgRes),   1);

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

          {tickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No tickets in this period.</p>
          ) : (
            <>
              {/* ── Top Performers ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Top Performers</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {topPerformers.map((row, i) => (
                    <div
                      key={row.assignee.name}
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
                      {row.assignee.avatar ? (
                        <img src={row.assignee.avatar} alt={row.assignee.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                          {row.assignee.fallback}
                        </div>
                      )}

                      {/* Name + role */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900">{row.assignee.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({row.assignee.role})</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 shrink-0 text-xs font-medium text-gray-600">
                        <span>Solved : <strong className="text-gray-900">{row.resolved}</strong></span>
                        <span>Avg Time : <strong className="text-gray-900">{row.avgRes > 0 ? `${round1(row.avgRes)}h` : "—"}</strong></span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: RANK_BG[i], color: RANK_COLORS[i], border: `1px solid ${RANK_COLORS[i]}40` }}
                        >
                          Success Rate : {row.successRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Two bar charts ── */}
              <div className="grid grid-cols-2 gap-4">

                {/* Tickets Resolved Comparison */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-4">Tickets Resolved Comparison</h4>
                  <div className="space-y-3">
                    {assigneeRows.map((row) => (
                      <div key={row.assignee.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">{row.assignee.name}</span>
                          <span className="text-xs font-bold text-gray-800 ml-2">{row.resolved}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((row.resolved / maxResolved) * 100)}%`,
                              background: "#F59E0B",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Average Resolution Time */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-4">Average Resolution Time</h4>
                  <div className="space-y-3">
                    {assigneeRows.map((row) => (
                      <div key={row.assignee.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">{row.assignee.name}</span>
                          <span className="text-xs font-bold text-gray-800 ml-2">
                            {row.avgRes > 0 ? `${round1(row.avgRes)}h` : "—"}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: row.avgRes > 0 ? `${Math.round((row.avgRes / maxAvgRes) * 100)}%` : "0%",
                              background: row.avgRes <= maxAvgRes * 0.4 ? "#10B981" : "#3B82F6",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Detailed Performance Breakdown ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Detailed Performance Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Assignee", "Department", "Assigned", "Resolved", "Success Rate", "Avg Time", "Workload", "Performance"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assigneeRows.map((row) => {
                      const badge   = perfBadge(row.successRate);
                      const wl      = workloadColor(row.openTickets);
                      return (
                        <tr key={row.assignee.name} className="hover:bg-gray-50 transition-colors">
                          {/* Assignee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {row.assignee.avatar ? (
                                <img src={row.assignee.avatar} alt={row.assignee.name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-[10px] shrink-0">
                                  {row.assignee.fallback}
                                </div>
                              )}
                              <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{row.assignee.name}</span>
                            </div>
                          </td>
                          {/* Department */}
                          <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{row.assignee.role}</td>
                          {/* Assigned */}
                          <td className="px-4 py-3.5 text-xs text-gray-700 font-medium">{row.assigned}</td>
                          {/* Resolved */}
                          <td className="px-4 py-3.5 text-xs text-gray-700 font-medium">{row.resolved}</td>
                          {/* Success Rate */}
                          <td className="px-4 py-3.5 text-xs text-gray-700 font-medium">{row.successRate}%</td>
                          {/* Avg Time */}
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            {row.avgRes > 0 ? `${round1(row.avgRes)}h` : "—"}
                          </td>
                          {/* Workload */}
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: wl.bg, color: wl.color }}
                            >
                              {workloadLabel(row.openTickets)} ({row.openTickets})
                            </span>
                          </td>
                          {/* Performance */}
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap"
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}