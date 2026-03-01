'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/AssigneeSidebar';
import { Header } from '@/components/layout/PerformanceTB';
import {
  MY_ACTIVE_TICKETS,
  MY_RESOLVED_TICKETS,
  CURRENT_ASSIGNEE,
  PRIORITY_STYLE,
} from '@/lib/assignee-dashboard-data';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

// ─── Period filter ────────────────────────────────────────────────────────────

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];

function periodToCutoff(p: string): number {
  const now = Date.now();
  switch (p) {
    case 'Last 7 days':  return now - 7  * 24 * 60 * 60 * 1000;
    case 'Last 30 days': return now - 30 * 24 * 60 * 60 * 1000;
    case 'Last 90 days': return now - 90 * 24 * 60 * 60 * 1000;
    case 'This year':    return new Date(new Date().getFullYear(), 0, 1).getTime();
    default:             return 0;
  }
}

function deadlineLabel(deadline: Date): { text: string; urgent: boolean } {
  const h = (deadline.getTime() - Date.now()) / 3_600_000;
  if (h < 0)  return { text: 'Overdue',                urgent: true  };
  if (h < 6)  return { text: `${Math.round(h)}h left`, urgent: true  };
  if (h < 24) return { text: `${Math.round(h)}h left`, urgent: false };
  return       { text: `${Math.floor(h / 24)}d left`,  urgent: false };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssigneePerformancePage() {
  const [period, setPeriod] = useState('Last 30 days');

  const cutoff = periodToCutoff(period);

  const resolvedInPeriod = useMemo(
    () => MY_RESOLVED_TICKETS.filter((t) => t.resolvedDate.getTime() >= cutoff),
    [period],
  );

  const solvedCount = resolvedInPeriod.filter((t) => t.status === 'solved').length;
  const failedCount = resolvedInPeriod.filter((t) => t.status === 'failed').length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userName={CURRENT_ASSIGNEE.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 pb-8">

          {/* Header row */}
          <div className="flex items-center justify-between mt-6 mb-5">
            <p className="text-sm text-gray-500">
              {CURRENT_ASSIGNEE.name} · {CURRENT_ASSIGNEE.role} · {CURRENT_ASSIGNEE.department}
            </p>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Period</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1">
              <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: '#3B82F6' }} />
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {MY_ACTIVE_TICKETS.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">Active Tickets</span>
              <span className="text-xs text-gray-400">Currently assigned to you</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1">
              <div className="w-8 h-1.5 rounded-full mb-2" style={{ background: '#10B981' }} />
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {resolvedInPeriod.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">Resolved</span>
              <span className="text-xs text-gray-400">{period.toLowerCase()}</span>
            </div>
          </div>

          {/* Detail tables */}
          <div className="grid grid-cols-2 gap-6">

            {/* Active ticket list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">
                Current Workload
                <span className="ml-2 text-xs font-semibold text-gray-400">({MY_ACTIVE_TICKETS.length})</span>
              </h4>
              {MY_ACTIVE_TICKETS.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No active tickets.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {MY_ACTIVE_TICKETS.map((t) => {
                    const dl = deadlineLabel(t.deadline);
                    return (
                      <div key={t.ticketId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">#{t.ticketId}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                          <p className="text-[10px] text-gray-400">{t.category}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: PRIORITY_STYLE[t.priority].bg, color: PRIORITY_STYLE[t.priority].color }}
                        >
                          {t.priority.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 shrink-0 ${dl.urgent ? 'text-red-500' : 'text-gray-400'}`}>
                          {dl.urgent && <AlertTriangle size={9} />}
                          <Clock size={9} />
                          {dl.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolved ticket list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-gray-800 mb-4">
                Resolved in Period
                <span className="ml-2 text-xs font-semibold text-gray-400">({resolvedInPeriod.length})</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-base font-extrabold text-green-700">{solvedCount}</p>
                    <p className="text-[10px] text-green-600">Solved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <XCircle size={14} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-base font-extrabold text-red-600">{failedCount}</p>
                    <p className="text-[10px] text-red-500">Failed</p>
                  </div>
                </div>
              </div>

              {resolvedInPeriod.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No resolved tickets in this period.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {resolvedInPeriod.map((t) => (
                    <div key={t.ticketId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">#{t.ticketId}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                        <p className="text-[10px] text-gray-400">{t.category}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        t.status === 'solved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}