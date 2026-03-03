"use client";

import React, { useState, useEffect } from "react";
import { X, Bot, AlertTriangle } from "lucide-react";

// Period helper

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

// Props

interface Props {
  open: boolean;
  onClose: () => void;
  period: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics?: any;
}

// Component

export function AIAccuracyModal({ open, onClose, period: externalPeriod }: Props) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);

  useEffect(() => {
    setLocalPeriod(externalPeriod);
  }, [externalPeriod]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-gray-100 shrink-0">
          <span className="text-xs text-gray-500">Period:</span>
          <select value={localPeriod} onChange={(e) => setLocalPeriod(e.target.value)}
            className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer">
            {PERIODS.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-8 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
            <AlertTriangle size={28} style={{ color: "#F59E0B" }} />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-base font-bold text-gray-800 mb-2">AI Metrics Not Yet Tracked</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI processing metrics such as suggestion acceptance rate, category match accuracy,
              and processing time are not yet recorded in the database. This section will be
              available once AI metric collection is implemented.
            </p>
          </div>
          <div className="mt-2 px-4 py-3 rounded-xl border text-xs text-gray-500" style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}>
            Expected fields:{" "}
            <code className="font-mono text-gray-700">aiProcessingSeconds</code>,{" "}
            <code className="font-mono text-gray-700">aiSuggestionAccepted</code>,{" "}
            <code className="font-mono text-gray-700">aiCategoryMatch</code>
          </div>
        </div>
      </div>
    </div>
  );
}
