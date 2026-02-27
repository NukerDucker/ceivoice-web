"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Download, Layers } from "lucide-react";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: "#F87171",
  high:     "#FBBF24",
  medium:   "#60A5FA",
  low:      "#34D399",
};

const PIE_COLORS = [
  "#6366F1", "#F59E0B", "#10B981", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number): string {
  return n.toFixed(1);
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

interface PieSlice {
  label: string;
  count: number;
  pct: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
  gap = 1.5,
): string {
  const s  = startDeg + gap;
  const e  = endDeg   - gap;
  if (e <= s) return "";
  const o1 = polarToXY(cx, cy, outerR, s);
  const o2 = polarToXY(cx, cy, outerR, e);
  const i1 = polarToXY(cx, cy, innerR, e);
  const i2 = polarToXY(cx, cy, innerR, s);
  const lg = e - s > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${lg} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${lg} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({ slices, total }: { slices: PieSlice[]; total: number }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const cx = 140, cy = 140, outerR = 110, innerR = 68;
  const active = hovered !== null ? slices[hovered] : null;

  return (
    <svg width={280} height={280} viewBox="0 0 280 280" style={{ overflow: "visible" }}>
      <defs>
        {slices.map((s, i) => (
          <filter key={i} id={`glow-${i}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={s.color} floodOpacity="0.5" />
          </filter>
        ))}
      </defs>

      {/* Slices */}
      {slices.map((s, i) => {
        const isHovered = hovered === i;
        const midAngle  = (s.startAngle + s.endAngle) / 2;
        const push      = isHovered ? 8 : 0;
        const rad       = ((midAngle - 90) * Math.PI) / 180;
        const tx        = Math.cos(rad) * push;
        const ty        = Math.sin(rad) * push;
        return (
          <path
            key={i}
            d={buildArcPath(cx, cy, outerR, innerR, s.startAngle, s.endAngle)}
            fill={s.color}
            opacity={hovered !== null && !isHovered ? 0.3 : 1}
            transform={`translate(${tx}, ${ty})`}
            filter={isHovered ? `url(#glow-${i})` : undefined}
            style={{ cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        );
      })}

      {/* Center label */}
      {active ? (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: active.color }}>
            {active.pct}%
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: "#6B7280" }}>
            {active.count} ticket{active.count !== 1 ? "s" : ""}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: "#374151" }}>
            {active.label}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 28, fontWeight: 800, fill: "#111827" }}>
            {total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: "#9CA3AF" }}>
            total tickets
          </text>
        </>
      )}

      {/* Callout lines for slices ≥ 10% */}
      {slices.map((s, i) => {
        if (s.pct < 10) return null;
        const midAngle = (s.startAngle + s.endAngle) / 2;
        const inner    = polarToXY(cx, cy, outerR + 6,  midAngle);
        const outer    = polarToXY(cx, cy, outerR + 20, midAngle);
        const textPt   = polarToXY(cx, cy, outerR + 28, midAngle);
        const anchor   = textPt.x > cx ? "start" : "end";
        return (
          <g key={`lbl-${i}`} opacity={hovered !== null && hovered !== i ? 0.15 : 1} style={{ transition: "opacity 0.2s" }}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={s.color} strokeWidth={1.5} />
            <text x={textPt.x} y={textPt.y} textAnchor={anchor} dominantBaseline="middle"
              style={{ fontSize: 10, fontWeight: 600, fill: "#374151" }}>
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryBreakdownModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  // ── Filter by period ──────────────────────────────────────────────────────
  const tickets = useMemo(() => {
    const cutoff = periodToCutoff(localPeriod);
    return DASHBOARD_TICKETS.filter((t) => new Date(t.date).getTime() >= cutoff);
  }, [localPeriod]);

  const total = tickets.length;

  // ── Category rows ─────────────────────────────────────────────────────────
  const categoryRows = useMemo(() => {
    const map: Record<string, {
      all: typeof tickets;
      resolved: typeof tickets;
      priorityCounts: Record<TicketPriority, number>;
    }> = {};

    tickets.forEach((t) => {
      if (!map[t.category]) {
        map[t.category] = {
          all: [],
          resolved: [],
          priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
        };
      }
      map[t.category].all.push(t);
      if (t.status === "resolved") map[t.category].resolved.push(t);
      map[t.category].priorityCounts[t.priority] += 1;
    });

    return Object.entries(map)
      .map(([category, { all, resolved, priorityCounts }]) => {
        const count   = all.length;
        const pct     = total > 0 ? Math.round((count / total) * 100) : 0;
        const avgRes  = avg(resolved.map((t) => t.resolutionHours ?? 0));
        const resRate = count > 0 ? Math.round((resolved.length / count) * 100) : 0;
        return { category, count, pct, avgRes, resRate, priorityCounts };
      })
      .sort((a, b) => b.count - a.count);
  }, [tickets, total]);

  // ── Pie slices ────────────────────────────────────────────────────────────
  const pieSlices: PieSlice[] = useMemo(() => {
    let angle = 0;
    return categoryRows.map((row, i) => {
      const span = (row.pct / 100) * 360;
      const slice: PieSlice = {
        label:      row.category,
        count:      row.count,
        pct:        row.pct,
        color:      PIE_COLORS[i % PIE_COLORS.length],
        startAngle: angle,
        endAngle:   angle + span,
      };
      angle += span;
      return slice;
    });
  }, [categoryRows]);

  // ── Stat cards ────────────────────────────────────────────────────────────
  const mostCommon = categoryRows[0] ?? null;

  const fastestCategory = useMemo(() => {
    const withRes = categoryRows.filter((r) => r.avgRes > 0);
    if (withRes.length === 0) return null;
    return withRes.reduce((best, r) => (r.avgRes < best.avgRes ? r : best));
  }, [categoryRows]);

  const categoriesActive = categoryRows.length;

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
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
            <Layers size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Category Breakdown</h2>
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

          {tickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No tickets in this period.</p>
          ) : (
            <>
              {/* ── Pie + Stat cards row ── */}
              <div className="flex gap-4">

                {/* Donut chart */}
                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
                  <DonutChart slices={pieSlices} total={total} />
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                    {pieSlices.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-gray-500">{s.label} <span className="font-semibold text-gray-700">{s.pct}%</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="flex flex-col gap-3 w-56 shrink-0">

                  {/* Most Common */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Most Common Category
                    </span>
                    <span className="text-base font-bold text-gray-900 mt-1">
                      {mostCommon?.category ?? "—"}
                    </span>
                    <span className="text-xs text-cyan-600 font-medium">
                      {mostCommon
                        ? `${mostCommon.count} ticket${mostCommon.count !== 1 ? "s" : ""} (${mostCommon.pct}% of total)`
                        : "—"}
                    </span>
                  </div>

                  {/* Fastest Resolution */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Fastest Resolution
                    </span>
                    <span className="text-2xl font-bold text-gray-900 mt-1">
                      {fastestCategory ? `${round1(fastestCategory.avgRes)}h` : "—"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {fastestCategory ? `${fastestCategory.category} average` : "No resolved tickets"}
                    </span>
                  </div>

                  {/* Categories Active */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Categories Active
                    </span>
                    <span className="text-2xl font-bold text-gray-900 mt-1">
                      {categoriesActive}
                    </span>
                    <span className="text-xs text-gray-400">Currently receiving tickets</span>
                  </div>

                </div>
              </div>

              {/* ── Detailed Category Analysis table ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Detailed Category Analysis</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Category", "Total", "Percentage", "Priority Distribution", "Avg Time", "Status"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categoryRows.map((row, i) => {
                      const color = PIE_COLORS[i % PIE_COLORS.length];
                      // Priority distribution — stacked segments
                      const priorities: TicketPriority[] = ["critical", "high", "medium", "low"];
                      return (
                        <tr key={row.category} className="hover:bg-gray-50 transition-colors">

                          {/* Category badge */}
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide"
                              style={{ borderColor: color, color: "#374151", background: `${color}33` }}
                            >
                              {row.category}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3.5 text-gray-700 font-medium">{row.count}</td>

                          {/* Percentage */}
                          <td className="px-4 py-3.5 text-gray-600">{row.pct}%</td>

                          {/* Priority distribution stacked bar */}
                          <td className="px-4 py-3.5">
                            <div className="h-3 rounded-full overflow-hidden flex w-36 bg-gray-100">
                              {priorities.map((p) => {
                                const segPct = row.count > 0
                                  ? (row.priorityCounts[p] / row.count) * 100
                                  : 0;
                                if (segPct === 0) return null;
                                return (
                                  <div
                                    key={p}
                                    className="h-full"
                                    style={{
                                      width: `${segPct}%`,
                                      background: PRIORITY_COLORS[p],
                                    }}
                                    title={`${p}: ${row.priorityCounts[p]}`}
                                  />
                                );
                              })}
                            </div>
                          </td>

                          {/* Avg Time */}
                          <td className="px-4 py-3.5 text-gray-600">
                            {row.avgRes > 0 ? `${round1(row.avgRes)}h` : "—"}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-gray-600">
                            {row.resRate}% resolved
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