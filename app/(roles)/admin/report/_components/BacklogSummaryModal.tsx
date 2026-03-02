'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Layers,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { STATUS_STYLES, BACKLOG_STATUS_META, REPORT_PERIODS as BACKLOG_PERIODS } from '@/lib/config';
import type { TicketStatus } from '@/types';
import { type ApiMetrics, type ApiStatusName, STATUS_NAME_TO_ID, nameFallback } from '@/types/api';

/** Capitalise a lowercase TicketStatus to match ApiStatusName keys. */
function toApiStatusName(s: TicketStatus): ApiStatusName {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as ApiStatusName;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BacklogSummaryModalProps {
  open: boolean;
  onClose: () => void;
  period: string;
  metrics: ApiMetrics | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_STYLES[status];
  const meta  = BACKLOG_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      {meta.label}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function BacklogSummaryModal({ open, onClose, period, metrics }: BacklogSummaryModalProps) {
  const [localPeriod, setLocalPeriod] = useState(period);

  useEffect(() => { setLocalPeriod(period); }, [period]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Derive from API metrics ───────────────────────────────────────────────

  const total        = metrics?.total_tickets ?? 0;
  const totalBacklog = metrics?.current_backlog ?? 0;

  // Status rows from metrics.tickets_by_status
  const statusRows = (Object.keys(BACKLOG_STATUS_META) as TicketStatus[]).map((status) => {
    const statusId = STATUS_NAME_TO_ID[toApiStatusName(status)] ?? -1;
    const entry    = metrics?.tickets_by_status.find((s) => s.status_id === statusId);
    const count    = entry?.count ?? 0;
    return {
      status,
      count,
      pct:   total > 0 ? Math.round((count / total) * 100) : 0,
      label: BACKLOG_STATUS_META[status].label,
      dot:   STATUS_STYLES[status].dot,
    };
  });

  // Category rows from metrics.top_categories
  const categoryRows = (metrics?.top_categories ?? []).map((c) => ({
    name:  c.category_name,
    total: c.count,
  }));

  // Assignee rows from metrics.assignee_workload
  const assigneeRows = (metrics?.assignee_workload ?? []).map((a) => {
    const capacity  = total > 0 ? Math.round((a.active_tickets / total) * 100) : 0;
    const loadColor =
      capacity >= 40 ? STATUS_STYLES.failed.dot
      : capacity >= 20 ? STATUS_STYLES.solving.dot
      : STATUS_STYLES.solved.dot;
    return {
      name:     a.assignee_name,
      fallback: nameFallback(a.assignee_name),
      open:     a.active_tickets,
      capacity,
      loadColor,
    };
  }).sort((a, b) => b.open - a.open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 15, 35, 0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#EEF2FF', color: '#6366F1' }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Backlog Summary</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {localPeriod}&nbsp;•&nbsp;{total} ticket{total !== 1 ? 's' : ''} in period
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={13} /> Export Report
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Period toolbar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-gray-100 flex-shrink-0">
          <span className="text-xs text-gray-500">Period:</span>
          <select
            value={localPeriod}
            onChange={(e) => setLocalPeriod(e.target.value)}
            className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer"
          >
            {BACKLOG_PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {total === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">
              No tickets found for <strong>{localPeriod}</strong>.
            </p>
          ) : (
            <>
              {/* Total Backlog KPI */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                    Total Backlog
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1" style={{ color: '#6366F1' }}>
                    {totalBacklog}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    unresolved out of {total} tickets in {localPeriod.toLowerCase()}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#EEF2FF' }}
                >
                  <Layers size={26} style={{ color: '#6366F1' }} />
                </div>
              </div>

              {/* Backlog by Category */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  Backlog by Category
                </h3>
                {categoryRows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No backlog tickets.</p>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Category', 'Total Tickets'].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {categoryRows.map((row) => (
                          <tr
                            key={row.name}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-xs font-semibold text-gray-800">{row.name}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-700">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tickets by Status */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={12} className="text-indigo-500" />
                  Tickets by Status
                </h3>
                <div className="space-y-3">
                  {statusRows.map((s) => (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                          <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {s.count} ticket{s.count !== 1 ? 's' : ''}&nbsp;({s.pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width:      `${s.pct}%`,
                            background: s.dot,
                            minWidth:   s.pct > 0 ? '2rem' : '0',
                          }}
                        >
                          {s.pct > 0 && (
                            <span className="text-white text-[9px] font-bold">{s.pct}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignee Backlog Load */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers size={12} className="text-indigo-400" />
                  Assignee Backlog Load
                </h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Assignee', 'Active Tickets', 'Load'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assigneeRows.map((a) => (
                        <tr
                          key={a.name}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: STATUS_STYLES.new.dot }}
                              >
                                <span className="text-white text-[9px] font-bold">{a.fallback}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-800">{a.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-gray-800">{a.open}</td>
                          <td className="px-4 py-2.5 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${a.capacity}%`, background: a.loadColor }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium w-7 text-right">
                                {a.capacity}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}