"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Download, Bot, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { DASHBOARD_TICKETS } from "@/lib/admin-dashboard-data";

// ─── Period helper ────────────────────────────────────────────────────────────

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];
const AI_SLA_SECONDS = 30; // EP06 requirement: 95% of requests must complete within 30s

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

function round1(n: number): string { return n.toFixed(1); }

// Compute true p95 from a sorted array
function percentile95(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.min(idx, sorted.length - 1)];
}

// Processing-time bucket labels & their upper bounds in seconds
const BUCKETS: { label: string; max: number; color: string }[] = [
  { label: "< 10s",   max: 10,       color: "#10B981" },
  { label: "10–20s",  max: 20,       color: "#3B82F6" },
  { label: "20–30s",  max: 30,       color: "#F59E0B" },
  { label: "> 30s",   max: Infinity, color: "#EF4444" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAccuracyModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── Filter tickets ────────────────────────────────────────────────────────
  const tickets = useMemo(() => {
    const cutoff = periodToCutoff(localPeriod);
    return DASHBOARD_TICKETS.filter((t) => new Date(t.date).getTime() >= cutoff);
  }, [localPeriod]);

  const total = tickets.length;

  // ── Core KPIs ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (total === 0) return null;

    const processingTimes  = tickets.map((t) => t.aiProcessingSeconds).sort((a, b) => a - b);
    const withinSla        = tickets.filter((t) => t.aiProcessingSeconds <= AI_SLA_SECONDS).length;
    const slaCompliance    = Math.round((withinSla / total) * 100);
    const p95              = percentile95(processingTimes);
    const avgProcessing    = avg(processingTimes);
    const accepted         = tickets.filter((t) => t.aiSuggestionAccepted).length;
    const acceptanceRate   = Math.round((accepted / total) * 100);
    const categoryMatches  = tickets.filter((t) => t.aiCategoryMatch).length;
    const categoryAccuracy = Math.round((categoryMatches / total) * 100);
    const slaBreachCount   = total - withinSla;

    return {
      slaCompliance,
      p95,
      avgProcessing,
      acceptanceRate,
      categoryAccuracy,
      slaBreachCount,
      withinSla,
    };
  }, [tickets, total]);

  // ── Processing time buckets ───────────────────────────────────────────────
  const bucketCounts = useMemo(() => {
    return BUCKETS.map((b, i) => {
      const prev = i === 0 ? 0 : BUCKETS[i - 1].max;
      const count = tickets.filter(
        (t) => t.aiProcessingSeconds > prev && t.aiProcessingSeconds <= b.max,
      ).length;
      return { ...b, count };
    });
  }, [tickets]);

  const maxBucketCount = Math.max(...bucketCounts.map((b) => b.count), 1);

  // ── Per-category acceptance ───────────────────────────────────────────────
  const categoryAcceptance = useMemo(() => {
    const map: Record<string, { accepted: number; total: number }> = {};
    tickets.forEach((t) => {
      if (!map[t.category]) map[t.category] = { accepted: 0, total: 0 };
      map[t.category].total += 1;
      if (t.aiSuggestionAccepted) map[t.category].accepted += 1;
    });
    return Object.entries(map)
      .map(([cat, { accepted, total: tot }]) => ({
        category: cat,
        rate: tot > 0 ? Math.round((accepted / tot) * 100) : 0,
        total: tot,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [tickets]);

  const maxCatRate = Math.max(...categoryAcceptance.map((c) => c.rate), 1);

  const now          = new Date();
  const updatedLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── SLA status helper ─────────────────────────────────────────────────────
  const slaStatus = kpis
    ? kpis.slaCompliance >= 95
      ? { label: "PASSING", color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", icon: <CheckCircle2 size={14} /> }
      : { label: "AT RISK",  color: "#C2410C", bg: "#FFF7ED", border: "#FDBA74", icon: <AlertTriangle size={14} /> }
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">AI Accuracy Report</h2>
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

          {total === 0 || !kpis ? (
            <p className="text-sm text-gray-400 text-center py-12">No tickets in this period.</p>
          ) : (
            <>
              {/* ── SLA Banner ── */}
              <div
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ background: slaStatus!.bg, borderColor: slaStatus!.border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${slaStatus!.color}20`, color: slaStatus!.color }}
                >
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: slaStatus!.color }}>
                      30-Second Processing SLA — {slaStatus!.label}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                      style={{ background: slaStatus!.bg, color: slaStatus!.color, borderColor: slaStatus!.border }}
                    >
                      {slaStatus!.icon} {slaStatus!.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requirement: 95% of requests must complete within {AI_SLA_SECONDS}s &nbsp;·&nbsp;
                    Current: <strong style={{ color: slaStatus!.color }}>{kpis.slaCompliance}%</strong> within SLA
                    &nbsp;·&nbsp; p95 processing time: <strong style={{ color: slaStatus!.color }}>{round1(kpis.p95)}s</strong>
                    {kpis.slaBreachCount > 0 && (
                      <span className="text-red-500 ml-2">({kpis.slaBreachCount} breach{kpis.slaBreachCount !== 1 ? "es" : ""})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* ── KPI Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: "SLA Compliance",
                    value: `${kpis.slaCompliance}%`,
                    sub: `Target ≥ 95% · ${kpis.withinSla}/${total} within 30s`,
                    color: kpis.slaCompliance >= 95 ? "#10B981" : "#EF4444",
                  },
                  {
                    label: "p95 Processing Time",
                    value: `${round1(kpis.p95)}s`,
                    sub: `Target < ${AI_SLA_SECONDS}s · avg ${round1(kpis.avgProcessing)}s`,
                    color: kpis.p95 <= AI_SLA_SECONDS ? "#10B981" : "#EF4444",
                  },
                  {
                    label: "Suggestion Acceptance",
                    value: `${kpis.acceptanceRate}%`,
                    sub: `${tickets.filter((t) => t.aiSuggestionAccepted).length} of ${total} accepted`,
                    color: "#6366F1",
                  },
                  {
                    label: "Category Accuracy",
                    value: `${kpis.categoryAccuracy}%`,
                    sub: `${tickets.filter((t) => t.aiCategoryMatch).length} of ${total} matched`,
                    color: "#F59E0B",
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-gray-100 p-4 flex flex-col gap-1 bg-white shadow-sm">
                    <span className="text-xs text-gray-500">{kpi.label}</span>
                    <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</span>
                    <span className="text-[10px] text-gray-400 leading-relaxed">{kpi.sub}</span>
                  </div>
                ))}
              </div>

              {/* ── Processing Time Distribution + Category Acceptance ── */}
              <div className="grid grid-cols-2 gap-4">

                {/* Processing time distribution */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-1">Processing Time Distribution</h4>
                  <p className="text-[10px] text-gray-400 mb-4">
                    SLA threshold: <span className="font-semibold text-amber-500">{AI_SLA_SECONDS}s</span>
                  </p>
                  <div className="space-y-3">
                    {bucketCounts.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: b.color }}
                            />
                            <span className="text-xs font-medium text-gray-600">{b.label}</span>
                            {b.label === "> 30s" && (
                              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
                                SLA BREACH
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-800">{b.count}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((b.count / maxBucketCount) * 100)}%`,
                              background: b.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acceptance rate by category */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-1">Acceptance Rate by Category</h4>
                  <p className="text-[10px] text-gray-400 mb-4">
                    % of AI suggestions accepted without major edits
                  </p>
                  <div className="space-y-3">
                    {categoryAcceptance.map((c) => (
                      <div key={c.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600 truncate max-w-[130px]">{c.category}</span>
                          <span className="text-xs font-bold text-gray-800 ml-2">{c.rate}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((c.rate / maxCatRate) * 100)}%`,
                              background: c.rate >= 80 ? "#6366F1" : c.rate >= 60 ? "#F59E0B" : "#EF4444",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Per-ticket detail table ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Ticket-Level AI Detail</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Ticket ID", "Category", "Processing Time", "SLA", "Category Match", "Suggestion"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tickets.map((t) => {
                      const breached = t.aiProcessingSeconds > AI_SLA_SECONDS;
                      return (
                        <tr key={t.ticketId} className={`transition-colors ${breached ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"}`}>
                          {/* Ticket ID */}
                          <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-700">{t.ticketId}</td>

                          {/* Category */}
                          <td className="px-4 py-3 text-xs text-gray-600">{t.category}</td>

                          {/* Processing time */}
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-bold"
                              style={{ color: breached ? "#EF4444" : t.aiProcessingSeconds <= 10 ? "#10B981" : "#374151" }}
                            >
                              {t.aiProcessingSeconds}s
                            </span>
                          </td>

                          {/* SLA badge */}
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={
                                breached
                                  ? { background: "#FFF1F2", color: "#BE123C", borderColor: "#FCA5A5" }
                                  : { background: "#F0FDF4", color: "#15803D", borderColor: "#86EFAC" }
                              }
                            >
                              {breached ? "BREACH" : "PASS"}
                            </span>
                          </td>

                          {/* Category match */}
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold ${t.aiCategoryMatch ? "text-green-600" : "text-red-500"}`}>
                              {t.aiCategoryMatch ? "✓ Match" : "✗ Mismatch"}
                            </span>
                          </td>

                          {/* Suggestion accepted */}
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={
                                t.aiSuggestionAccepted
                                  ? { background: "#EEF2FF", color: "#4338CA", borderColor: "#A5B4FC" }
                                  : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }
                              }
                            >
                              {t.aiSuggestionAccepted ? "ACCEPTED" : "EDITED"}
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