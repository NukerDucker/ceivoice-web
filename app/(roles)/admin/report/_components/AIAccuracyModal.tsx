"use client";

import { useState, useEffect } from "react";
import { X, Bot, Cpu, CheckCircle2, Tag, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

function periodToParam(p: string): string {
  if (p === "Last 7 days")  return "last_7_days";
  if (p === "Last 30 days") return "last_30_days";
  if (p === "Last 90 days") return "last_90_days";
  return "";
}

interface AiMetrics {
  total_processed:           number;
  evaluated_count:           number;
  avg_processing_s:          number;
  category_match_count:      number;
  suggestion_accepted_count: number;
  category_match_pct:        number | null;
  suggestion_accepted_pct:   number | null;
  recent: {
    id:                  number;
    processed_at:        string;
    suggestion_accepted: boolean;
    category_match:      boolean;
    ticket:              { title: string } | null;
    suggested_category:  { name: string } | null;
    final_category:      { name: string } | null;
  }[];
}

interface Props {
  open:    boolean;
  onClose: () => void;
  period:  string;
  metrics?: unknown;
}

export function AIAccuracyModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);
  const [data,        setData]        = useState<AiMetrics | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => { setLocalPeriod(externalPeriod); }, [externalPeriod]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    const param = periodToParam(localPeriod);
    const url   = param ? `/reporting/admin/ai-accuracy?period=${param}` : "/reporting/admin/ai-accuracy";
    apiFetch<{ metrics: AiMetrics }>(url)
      .then((res) => setData(res.metrics))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load AI metrics"))
      .finally(() => setLoading(false));
  }, [open, localPeriod]);

  if (!open) return null;

  const kpis = [
    { label: "Total Processed",    value: data?.total_processed ?? "—",                                    icon: <Cpu size={16} />,          color: "#6366F1" },
    { label: "Category Match",     value: data?.category_match_pct != null ? `${data.category_match_pct}%` : "—",     icon: <Tag size={16} />,          color: "#10B981" },
    { label: "Suggestion Accepted",value: data?.suggestion_accepted_pct != null ? `${data.suggestion_accepted_pct}%` : "—", icon: <CheckCircle2 size={16} />, color: "#3B82F6" },
    { label: "Avg Processing",     value: data?.avg_processing_s != null ? `${data.avg_processing_s}s` : "—", icon: <Clock size={16} />,        color: "#F59E0B" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">AI Accuracy &amp; Performance</h2>
            <p className="text-xs text-gray-400 mt-0.5">{localPeriod}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-gray-100 shrink-0">
          <span className="text-xs text-gray-500">Period:</span>
          <select
            value={localPeriod}
            onChange={(e) => setLocalPeriod(e.target.value)}
            className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer"
          >
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-16">Loading AI metrics…</p>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-16">{error}</p>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kpis.map((k) => (
                  <div key={k.label} className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
                    <span style={{ color: k.color }}>{k.icon}</span>
                    <span className="text-2xl font-extrabold text-gray-900">{k.value}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{k.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Accuracy Breakdown</h4>
                {[
                  { label: "Category Match",      pct: data?.category_match_pct ?? 0,      count: data?.category_match_count ?? 0,      color: "#10B981" },
                  { label: "Suggestion Accepted", pct: data?.suggestion_accepted_pct ?? 0, count: data?.suggestion_accepted_count ?? 0, color: "#3B82F6" },
                ].map(({ label, pct, count, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{label}</span>
                      <span className="text-xs font-bold text-gray-800">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent tickets */}
              {data && data.recent.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recent AI-Processed Tickets</h4>
                  <div className="space-y-2">
                    {data.recent.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{r.ticket?.title ?? "—"}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {r.suggested_category?.name ?? "No suggestion"} → {r.final_category?.name ?? "No final"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.category_match ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                            {r.category_match ? "Match" : "Miss"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.suggestion_accepted ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {r.suggestion_accepted ? "Accepted" : "Rejected"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data && data.total_processed === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No AI-processed tickets in this period.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
