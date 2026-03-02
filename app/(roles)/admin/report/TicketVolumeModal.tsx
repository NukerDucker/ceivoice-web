'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Download, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { type ApiMetrics, periodToApiParam } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekRow {
  label: string;
  total: number;
  dailyAvg: number;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  change: number;
}

interface TicketVolumeModalProps {
  open:     boolean;
  onClose:  () => void;
  period:   string;
  metrics:  ApiMetrics | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPct(n: number): string {
  return (n > 0 ? '+' : '') + n.toFixed(1) + '%';
}

// ─── Stats computation from API trend data ───────────────────────────────────

type TrendData = Record<string, Record<string, number>>; // category → date → count

function computeStatsFromTrends(trends: TrendData, totalFromMetrics: number) {
  // Collapse all categories to a single day→count map
  const byDay: Record<string, number> = {};
  Object.values(trends).forEach(catDays => {
    Object.entries(catDays).forEach(([date, count]) => {
      byDay[date] = (byDay[date] ?? 0) + count;
    });
  });

  const total = totalFromMetrics || Object.values(byDay).reduce((s, n) => s + n, 0);
  const sortedDays = Object.keys(byDay).sort();
  const dayCounts  = sortedDays.map(d => byDay[d]);

  const avgPerDay = dayCounts.length
    ? Math.round((dayCounts.reduce((s, n) => s + n, 0) / dayCounts.length) * 10) / 10
    : 0;

  const mid      = Math.floor(sortedDays.length / 2);
  const prevHalf = sortedDays.slice(0, mid).map(d => byDay[d]);
  const currHalf = sortedDays.slice(mid).map(d => byDay[d]);

  const sumOf = (arr: number[]) => arr.reduce((s, n) => s + n, 0);
  const avgOf = (arr: number[]) => arr.length ? sumOf(arr) / arr.length : 0;

  const totalGrowthPct = prevHalf.length === 0 ? 0
    : Math.round(((sumOf(currHalf) - sumOf(prevHalf)) / sumOf(prevHalf)) * 1000) / 10;
  const avgGrowthPct = avgOf(prevHalf) === 0 ? 0
    : Math.round(((avgOf(currHalf) - avgOf(prevHalf)) / avgOf(prevHalf)) * 1000) / 10;

  const peakEntry   = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const lowestEntry = Object.entries(byDay).sort((a, b) => a[1] - b[1])[0];
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Last 5 weeks
  const now  = Date.now();
  const DAY  = 86400000;
  const WEEK = 7 * DAY;
  const weeks: WeekRow[] = [];
  for (let w = 4; w >= 0; w--) {
    const endMs   = now - w * WEEK;
    const startMs = endMs - WEEK;
    const inRange = sortedDays
      .filter(d => { const t = new Date(d).getTime(); return t >= startMs && t < endMs; })
      .map(d => byDay[d]);
    const weekTotal    = sumOf(inRange);
    const prevInRange  = sortedDays
      .filter(d => { const t = new Date(d).getTime(); return t >= startMs - WEEK && t < startMs; })
      .map(d => byDay[d]);
    const prevWeekTotal = sumOf(prevInRange);
    const days     = Math.max(Math.round((Math.min(endMs, now) - startMs) / DAY), 1);
    const dailyAvg = Math.round((weekTotal / days) * 10) / 10;
    const changePct = prevWeekTotal === 0 ? 0
      : Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 1000) / 10;
    const trend: WeekRow['trend'] =
      changePct > 2 ? 'Increasing' : changePct < -2 ? 'Decreasing' : 'Stable';
    const start = new Date(startMs);
    const end   = new Date(endMs);
    const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${
      w === 0 ? 'Present' : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }`;
    weeks.push({ label, total: weekTotal, dailyAvg, trend, change: changePct });
  }

  // Category split (pass-through from trend keys)
  const categorySplit = Object.entries(
    Object.fromEntries(
      Object.entries(trends).map(([cat, days]) => [cat, sumOf(Object.values(days))])
    )
  ).sort((a, b) => b[1] - a[1]);

  return {
    total, totalGrowthPct, avgPerDay, avgGrowthPct,
    peakDay:     peakEntry   ? peakEntry[1]   : 0,
    peakDate:    peakEntry   ? fmtDate(peakEntry[0])   : '—',
    lowestDay:   lowestEntry ? lowestEntry[1] : 0,
    lowestDate:  lowestEntry ? fmtDate(lowestEntry[0]) : '—',
    weeks, categorySplit,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketVolumeModal({ open, onClose, period, metrics }: TicketVolumeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [trends,    setTrends]    = useState<TrendData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Fetch trend data (per-day per-category) whenever modal opens
  useEffect(() => {
    if (!open) return;
    setTrendsLoading(true);
    const daysParam = period === 'Last 7 days' ? 7 : period === 'Last 90 days' ? 90 : 30;
    apiFetch(`/reporting/admin/category-trends?days=${daysParam}`)
      .then((res: { trends: TrendData }) => setTrends(res.trends))
      .catch(() => setTrends(null))
      .finally(() => setTrendsLoading(false));
  }, [open, period]);

  const stats = useMemo(() => {
    if (!trends) return null;
    return computeStatsFromTrends(trends, metrics?.total_tickets ?? 0);
  }, [trends, metrics]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const now = new Date();
  const updatedAt = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const trendIcon = (trend: WeekRow['trend'], change: number) => {
    if (trend === 'Increasing') return <TrendingUp size={13} className="text-emerald-500" />;
    if (trend === 'Decreasing') return <TrendingDown size={13} className="text-red-400" />;
    return <Minus size={13} className="text-gray-400" />;
  };

  const changeColor = (n: number) =>
    n > 0 ? 'text-emerald-600' : n < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Modal panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Ticket Volume Report
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {period} &bull; Updated today at {updatedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              onClick={() => alert('Export coming soon!')}
            >
              <Download size={13} />
              Export Report
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* KPI row */}
          {trendsLoading || !stats ? (
            <p className="text-xs text-gray-400 text-center py-10">
              {trendsLoading ? 'Loading trend data…' : 'No trend data available for this period.'}
            </p>
          ) : (
            <>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: 'Total Tickets',
                value: stats.total,
                sub: formatPct(stats.totalGrowthPct),
                subColor: stats.totalGrowthPct >= 0 ? 'text-emerald-600' : 'text-red-500',
              },
              {
                label: 'Average per day',
                value: stats.avgPerDay,
                sub: formatPct(stats.avgGrowthPct),
                subColor: stats.avgGrowthPct >= 0 ? 'text-emerald-600' : 'text-red-500',
              },
              {
                label: 'Peak day',
                value: stats.peakDay,
                sub: stats.peakDate,
                subColor: 'text-gray-500',
              },
              {
                label: 'Lowest day',
                value: stats.lowestDay,
                sub: stats.lowestDate,
                subColor: 'text-gray-500',
              },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4"
              >
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{k.value}</p>
                <p className={`text-xs font-semibold mt-0.5 ${k.subColor}`}>{k.sub}</p>
              </div>
            ))}
          </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-800">Weekly Breakdown</h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Week', 'Total Tickets', 'Daily Average', 'Trend', 'Change'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.weeks.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-gray-700 font-medium">{row.label}</td>
                    <td className="px-5 py-3 text-xs font-bold text-gray-900">{row.total}</td>
                    <td className="px-5 py-3 text-xs text-gray-700">{row.dailyAvg}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {trendIcon(row.trend, row.change)}
                        <span className="text-xs text-gray-600">{row.trend}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-xs font-semibold ${changeColor(row.change)}`}>
                      {row.change > 0 ? '+' : ''}{row.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category split mini bars */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Volume by Category</h4>
            <div className="space-y-2.5">
              {stats.categorySplit.map(([name, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 truncate">{name}</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          </>)}
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}