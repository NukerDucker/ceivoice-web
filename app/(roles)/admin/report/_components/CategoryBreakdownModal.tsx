"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Layers } from "lucide-react";
import { type ApiMetrics } from '@/types/api';

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

const PIE_COLORS = [
  "#6366F1", "#F59E0B", "#10B981", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

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
  const s = startDeg + gap;
  const e = endDeg   - gap;
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

function DonutChart({
  slices,
  total,
  size = 280,
}: {
  slices: PieSlice[];
  total: number;
  size?: number;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const scale  = size / 280;
  const cx     = 140 * scale;
  const cy     = 140 * scale;
  const outerR = 110 * scale;
  const innerR = 68  * scale;
  const active = hovered !== null ? slices[hovered] : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", maxWidth: "100%" }}>
      <defs>
        {slices.map((s, i) => (
          <filter key={i} id={`glow-${i}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={s.color} floodOpacity="0.5" />
          </filter>
        ))}
      </defs>

      {slices.map((s, i) => {
        const isHovered = hovered === i;
        const midAngle  = (s.startAngle + s.endAngle) / 2;
        const push      = isHovered ? 8 * scale : 0;
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

      {active ? (
        <>
          <text x={cx} y={cy - 10 * scale} textAnchor="middle" style={{ fontSize: 24 * scale, fontWeight: 800, fill: active.color }}>
            {active.pct}%
          </text>
          <text x={cx} y={cy + 12 * scale} textAnchor="middle" style={{ fontSize: 11 * scale, fill: "#6B7280" }}>
            {active.count} ticket{active.count !== 1 ? "s" : ""}
          </text>
          <text x={cx} y={cy + 28 * scale} textAnchor="middle" style={{ fontSize: 10 * scale, fontWeight: 700, fill: "#374151" }}>
            {active.label}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6 * scale} textAnchor="middle" style={{ fontSize: 28 * scale, fontWeight: 800, fill: "#111827" }}>
            {total}
          </text>
          <text x={cx} y={cy + 14 * scale} textAnchor="middle" style={{ fontSize: 11 * scale, fill: "#9CA3AF" }}>
            total tickets
          </text>
        </>
      )}

      {slices.map((s, i) => {
        if (s.pct < 10) return null;
        const midAngle = (s.startAngle + s.endAngle) / 2;
        const inner    = polarToXY(cx, cy, outerR + 6  * scale, midAngle);
        const outer    = polarToXY(cx, cy, outerR + 20 * scale, midAngle);
        const textPt   = polarToXY(cx, cy, outerR + 28 * scale, midAngle);
        const anchor   = textPt.x > cx ? "start" : "end";
        return (
          <g key={`lbl-${i}`} opacity={hovered !== null && hovered !== i ? 0.15 : 1} style={{ transition: "opacity 0.2s" }}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={s.color} strokeWidth={1.5} />
            <text x={textPt.x} y={textPt.y} textAnchor={anchor} dominantBaseline="middle"
              style={{ fontSize: 10 * scale, fontWeight: 600, fill: "#374151" }}>
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
  metrics: ApiMetrics | null;
}

export function CategoryBreakdownModal({ open, onClose, period: externalPeriod, metrics }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);
  const isMobile = useIsMobile(640);

  useEffect(() => { setLocalPeriod(externalPeriod); }, [externalPeriod]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const categoryRows = useMemo(() => {
    if (!metrics?.top_categories) return [];
    const catTotal = metrics.top_categories.reduce((s: number, c) => s + c.count, 0);
    return metrics.top_categories.map((c) => ({
      category: c.category_name,
      count: c.count,
      pct: catTotal > 0 ? Math.round((c.count / catTotal) * 100) : 0,
    }));
  }, [metrics]);

  const total = metrics?.total_tickets ?? 0;

  const pieSlices: PieSlice[] = useMemo(() => {
    return categoryRows.reduce<{ slices: PieSlice[]; angle: number }>(
      (acc, row, i) => {
        const span = (row.pct / 100) * 360;
        const slice: PieSlice = {
          label: row.category, count: row.count, pct: row.pct,
          color: PIE_COLORS[i % PIE_COLORS.length],
          startAngle: acc.angle, endAngle: acc.angle + span,
        };
        return { slices: [...acc.slices, slice], angle: acc.angle + span };
      },
      { slices: [], angle: 0 },
    ).slices;
  }, [categoryRows]);

  const mostCommon       = categoryRows[0] ?? null;
  const categoriesActive = categoryRows.length;
  const updatedLabel     = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const donutSize        = isMobile ? 200 : 280;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl flex flex-col rounded-t-2xl max-h-[92dvh] sm:rounded-2xl sm:shadow-2xl sm:max-h-[90vh]">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-3 sm:pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
            <Layers size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Category Breakdown</h2>
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

        {/* Body */}
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

          {categoryRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No tickets in this period.</p>
          ) : (
            <>
              {/* Chart + Stats */}
              <div className="flex flex-col sm:flex-row gap-4">

                {/* Donut */}
                <div className="w-full sm:flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
                  <DonutChart slices={pieSlices} total={total} size={donutSize} />
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                    {pieSlices.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-gray-500">
                          {s.label} <span className="font-semibold text-gray-700">{s.pct}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stat cards — row on mobile, column on sm+ */}
                <div className="flex flex-row sm:flex-col gap-3 sm:w-56 sm:shrink-0">
                  <div className="flex-1 sm:flex-none bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Most Common</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 mt-1 leading-tight">
                      {mostCommon?.category ?? "—"}
                    </span>
                    <span className="text-xs text-cyan-600 font-medium">
                      {mostCommon ? `${mostCommon.count} ticket${mostCommon.count !== 1 ? "s" : ""} (${mostCommon.pct}%)` : "—"}
                    </span>
                  </div>
                  <div className="flex-1 sm:flex-none bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Active</span>
                    <span className="text-2xl font-bold text-gray-900 mt-1">{categoriesActive}</span>
                    <span className="text-xs text-gray-400">Categories</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Detailed Category Analysis</h3>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {categoryRows.map((row, i) => {
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <div key={row.category} className="flex items-center justify-between px-4 py-3 gap-3">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0"
                          style={{ borderColor: color, color: "#374151", background: `${color}33` }}
                        >
                          {row.category}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-700 font-medium">{row.count} tickets</span>
                          <span className="text-gray-400">{row.pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Category", "Total", "Percentage"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categoryRows.map((row, i) => {
                      const color = PIE_COLORS[i % PIE_COLORS.length];
                      return (
                        <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide"
                              style={{ borderColor: color, color: "#374151", background: `${color}33` }}
                            >
                              {row.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-700 font-medium">{row.count}</td>
                          <td className="px-4 py-3.5 text-gray-600">{row.pct}%</td>
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