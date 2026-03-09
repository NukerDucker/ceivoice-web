"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api-client";
import { getCatStyle } from "@/lib/utils";
import { TicketDetailModal } from './_components/ticket-detail-modal';

// ─── API types ────────────────────────────────────────────────────────────────

export interface ApiTicketSummary {
  ticket_id: number;
  title:     string | null;
  priority:  string;
  deadline:  string | null;
  created_at: string;
  category:  { category_id: number; name: string } | null;
  status:    { name: string } | null;
  assignee:  { user_id: string; full_name: string | null; user_name: string | null; email: string } | null;
  creator:   { user_id: string; full_name: string | null; user_name: string | null; email: string } | null;
}

// ─── Style maps ───────────────────────────────────────────────────────────────


const PRIORITY_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  critical: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  high:     { bg: '#fef3c2', color: '#92400e', dot: '#f59e0b' },
  medium:   { bg: '#e0f2fe', color: '#0369a1', dot: '#38bdf8' },
  low:      { bg: '#f0fdf4', color: '#166534', dot: '#4ade80' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  New:      { bg: '#dbeafe', text: '#1e40af' },
  Assigned: { bg: '#e0e7ff', text: '#3730a3' },
  Solving:  { bg: '#fef3c2', text: '#92400e' },
  Solved:   { bg: '#dcfce7', text: '#166534' },
  Failed:   { bg: '#fee2e2', text: '#991b1b' },
  Renew:    { bg: '#f3e8ff', text: '#6b21a8' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(date: Date | string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function timeUntil(date: string | null) {
  if (!date) return { label: 'No deadline', urgent: false };
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return { label: 'OVERDUE', urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 24) return { label: `${h}h ${m}m`, urgent: h < 6 };
  return { label: `${Math.floor(h / 24)}d ${h % 24}h`, urgent: false };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor, bgColor }: {
  label: string; value: string | number; sub: string;
  subColor: string; bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bgColor }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-3xl sm:text-4xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssigneeDashboardPage() {
  const [tickets,        setTickets]        = useState<ApiTicketSummary[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [sortBy,         setSortBy]         = useState<"deadline" | "priority">("deadline");
  const [selectedId,     setSelectedId]     = useState<number | null>(null);

  const loadTickets = useCallback(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await apiFetch<ApiTicketSummary[]>('/tickets/assigned');
        if (!cancelled) { setTickets(data); setLoading(false); }
      } catch (err: unknown) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadTickets(), [loadTickets]);

  const sorted = useMemo(() => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...tickets].sort((a, b) => {
      if (sortBy === 'deadline') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    });
  }, [tickets, sortBy]);

  const criticalCount = tickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length;

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <Header />

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Stat cards — 2 cols on mobile, 4 on large */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="My Active Tickets"  value={loading ? '…' : tickets.length}  sub="Currently assigned to you"  subColor="#6366f1" bgColor="#dbeafe" />
            <StatCard label="Critical / Urgent"  value={loading ? '…' : criticalCount}   sub="Need immediate action"      subColor="#ef4444" bgColor="#fef3c2" />
            <StatCard label="Overdue"            value={loading ? '…' : tickets.filter((t) => t.deadline && new Date(t.deadline) < new Date()).length} sub="Past deadline" subColor="#ef4444" bgColor="#fee2e2" />
            <StatCard label="No Deadline"        value={loading ? '…' : tickets.filter((t) => !t.deadline).length} sub="Deadline not set" subColor="#64748b" bgColor="#f1f5f9" />
          </div>

          {/* Active workload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Card header — stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Active Workload</h3>
                  <p className="text-xs text-slate-500">Your open tickets — solved & failed excluded</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                  {([{ key: "deadline", label: "Deadline" }, { key: "priority", label: "Priority" }] as const).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                      style={{
                        background: sortBy === opt.key ? '#fff' : 'transparent',
                        color:      sortBy === opt.key ? '#0f172a' : '#64748b',
                        boxShadow:  sortBy === opt.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-sm text-slate-400">Loading tickets…</div>
            ) : error ? (
              <div className="text-center py-12 text-sm text-red-500">{error}</div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-semibold text-slate-500">All caught up! No active tickets.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sorted.map((t) => {
                  const cs       = getCatStyle(t.category?.name ?? '');
                  const st       = STATUS_STYLES[t.status?.name ?? ''] ?? { bg: '#f1f5f9', text: '#475569' };
                  const pr       = PRIORITY_STYLE[t.priority]           ?? PRIORITY_STYLE.medium;
                  const timeLeft = timeUntil(t.deadline);
                  return (
                    <div
                      key={t.ticket_id}
                      className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedId(t.ticket_id)}
                    >
                      {/* Priority dot — hidden on very small, shown sm+ */}
                      <div className="hidden sm:block w-2 h-2 rounded-full shrink-0 mt-1 sm:mt-0" style={{ background: pr.dot }} />

                      {/* Main content */}
                      <div className="flex-1 min-w-0">

                        {/* Row 1: ticket id · category tag · creator email · created date */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="sm:hidden w-2 h-2 rounded-full shrink-0" style={{ background: pr.dot }} />
                          <span className="text-xs font-bold text-slate-400">#{t.ticket_id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={cs}>
                            {t.category?.name ?? 'General'}
                          </span>
                          {t.creator?.email && (
                            <span className="text-[10px] text-slate-500 font-medium">{t.creator.email}</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Row 2: title · opened X ago inline */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {t.title ?? '(Untitled)'}
                          </p>
                          <p className="text-xs text-slate-400 shrink-0">Opened {timeAgo(t.created_at)}</p>
                        </div>

                        {/* On mobile: show status + deadline inline below title */}
                        <div className="flex items-center gap-2 mt-2 sm:hidden flex-wrap">
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.text }}
                          >
                            {t.status?.name ?? '—'}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${timeLeft.urgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            {timeLeft.urgent && '⚠ '}{timeLeft.label}
                          </span>
                        </div>
                      </div>

                      {/* Time remaining — desktop only */}
                      <div className="hidden sm:flex shrink-0 flex-col items-center">
                        <p className="text-[10px] text-slate-400 mb-1">Time remaining</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${timeLeft.urgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                          {timeLeft.urgent && '⚠ '}{timeLeft.label}
                        </span>
                      </div>

                      {/* Status — desktop only */}
                      <div className="hidden sm:flex shrink-0 flex-col items-center">
                        <p className="text-[10px] text-slate-400 mb-1">Status</p>
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: st.bg, color: st.text }}>
                          {t.status?.name ?? '—'}
                        </span>
                      </div>

                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1 sm:mt-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedId !== null && (
        <TicketDetailModal
          ticketId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={loadTickets}
        />
      )}
    </>
  );
}