"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import {
  OTHER_ASSIGNEES,
  getCatStyle,
  PRIORITY_STYLE,
  STATUS_STYLES,
  type AssigneeTicket,
  type TicketHistoryEntry,
} from "@/lib/assignee-dashboard-data";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardAssignee = {
  name: string;
  fallback?: string;
  department?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  draft:    "DRAFT",
  new:      "NEW",
  assigned: "ASSIGNED",
  solving:  "SOLVING",
  solved:   "SOLVED",
  failed:   "FAILED",
  renew:    "RENEW",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();

export function timeAgo(date: Date | string) {
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function timeUntil(date: Date | string) {
  const diff = new Date(date).getTime() - now.getTime();
  if (diff < 0) return { label: "OVERDUE", urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 24) return { label: `${h}h ${m}m`, urgent: h < 6 };
  return { label: `${Math.floor(h / 24)}d ${h % 24}h`, urgent: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

export function Avatar({
  user,
  size = 8,
}: {
  user: { name?: string; fallback?: string };
  size?: number;
}) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
    >
      {(user.fallback || user.name?.charAt(0) || "?").toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface TicketDetailModalProps {
  ticket:      AssigneeTicket;
  currentUser: DashboardAssignee;
  onClose:     () => void;
  onUpdate:    (ticketId: string, updates: Partial<AssigneeTicket>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function TicketDetailModal({
  ticket,
  currentUser,
  onClose,
  onUpdate,
}: TicketDetailModalProps) {
  const [status, setStatus]                       = useState(ticket.status);
  const [newComment, setNewComment]               = useState("");
  const [commentType, setCommentType]             = useState<"internal" | "public">("internal");
  const [comments, setComments]                   = useState(ticket.comments);
  const [history, setHistory]                     = useState(ticket.history);
  const [showReassign, setShowReassign]           = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [activeTab, setActiveTab]                 = useState<"details" | "history" | "comments">("details");
  const [pendingStatus, setPendingStatus]         = useState<"solved" | "failed" | null>(null);

  const statusOptions = ["assigned", "solving", "solved", "failed"] as const;
  const isResolutionStatus = (s: string) => s === "solved" || s === "failed";

  // ── Status change handlers ────────────────────────────────────────────────

  const handleStatusChange = (newStatus: typeof statusOptions[number]) => {
    if (isResolutionStatus(newStatus) && newStatus !== status) {
      setPendingStatus(newStatus as "solved" | "failed");
      setActiveTab("comments");
      return;
    }
    commitStatusChange(newStatus);
  };

  const commitStatusChange = (newStatus: typeof statusOptions[number]) => {
    const entry: TicketHistoryEntry = {
      action:    "Status Change",
      oldStatus: status,
      newStatus,
      by:        currentUser.name,
      timestamp: new Date(),
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setStatus(newStatus);
    setPendingStatus(null);
    onUpdate(ticket.ticketId, { status: newStatus, history: updatedHistory });
  };

  // ── Comment handler ───────────────────────────────────────────────────────

  const handleComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      author:    currentUser.name,
      type:      commentType,
      text:      newComment.trim(),
      timestamp: new Date(),
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
    if (pendingStatus) commitStatusChange(pendingStatus);
  };

  // ── Reassign handler ──────────────────────────────────────────────────────

  const handleReassign = () => {
    if (selectedAssignees.length === 0) return;
    const entry: TicketHistoryEntry = {
      action:    "Reassigned",
      oldStatus: status,
      newStatus: status,
      by:        currentUser.name,
      detail:    `Reassigned to: ${selectedAssignees.join(", ")}`,
      timestamp: new Date(),
    };
    setHistory((prev) => [...prev, entry]);
    setShowReassign(false);
    setSelectedAssignees([]);
  };

  const cs       = getCatStyle(ticket.category);
  const timeLeft = timeUntil(ticket.deadline);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider">{ticket.ticketId}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: cs.bg, color: cs.color }}
              >
                {ticket.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-1">
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 shrink-0 px-6">
          {(["details", "history", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "history" ? "Audit Log" : tab === "comments" ? "Communication" : "Details & Actions"}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (
            <div className="space-y-5">

              {/* Info cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_STYLE[ticket.priority]?.dot }} />
                    <span className="text-sm font-bold capitalize" style={{ color: PRIORITY_STYLE[ticket.priority]?.color }}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                  <span className={`text-sm font-bold ${timeLeft.urgent ? "text-red-600" : "text-slate-900"}`}>
                    {timeLeft.label}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Opened</p>
                  <span className="text-sm font-semibold text-slate-700">{timeAgo(ticket.date)}</span>
                </div>
              </div>

              {/* Status controls */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => {
                    const st = STATUS_STYLES[s];
                    const isActive = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                          isActive ? "border-current shadow-md scale-[1.02]" : "border-transparent opacity-60 hover:opacity-90"
                        }`}
                        style={{ background: st.bg, color: st.text }}
                      >
                        {isActive && "✓ "}{STATUS_LABEL[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reassign */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-700">Reassignment</p>
                  <button
                    onClick={() => setShowReassign(!showReassign)}
                    className="text-xs font-semibold px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                  >
                    ↗ Reassign Ticket
                  </button>
                </div>
                {showReassign && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-orange-700 font-medium">
                      Select one or more assignees to redirect this ticket:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {OTHER_ASSIGNEES.map((a) => (
                        <label
                          key={a.name}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-orange-100 cursor-pointer hover:border-orange-300 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssignees.includes(a.name)}
                            onChange={(e) =>
                              setSelectedAssignees((prev) =>
                                e.target.checked ? [...prev, a.name] : prev.filter((n) => n !== a.name)
                              )
                            }
                            className="accent-orange-500"
                          />
                          <Avatar user={a} size={6} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{a.name}</p>
                            <p className="text-[10px] text-slate-500">{a.department}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReassign}
                        disabled={selectedAssignees.length === 0}
                        className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-40 transition-colors"
                      >
                        Confirm Reassign ({selectedAssignees.length})
                      </button>
                      <button
                        onClick={() => { setShowReassign(false); setSelectedAssignees([]); }}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIT LOG TAB ── */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">
                Read-only audit trail of all status changes and actions on this ticket.
              </p>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-3 pl-10">
                  {history.map((h, i) => {
                    const oldSt = h.oldStatus ? STATUS_STYLES[h.oldStatus] : null;
                    const newSt = STATUS_STYLES[h.newStatus];
                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-3 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">{h.action}</span>
                            <span className="text-[10px] text-slate-400">{timeAgo(h.timestamp)}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            By: <span className="font-semibold text-slate-700">{h.by}</span>
                          </p>
                          {oldSt && newSt && h.oldStatus !== h.newStatus && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: oldSt.bg, color: oldSt.text }}>
                                {STATUS_LABEL[h.oldStatus!]}
                              </span>
                              <span className="text-slate-400 text-xs">→</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: newSt.bg, color: newSt.text }}>
                                {STATUS_LABEL[h.newStatus]}
                              </span>
                            </div>
                          )}
                          {h.detail && (
                            <p className="text-xs text-orange-600 font-medium mt-1">{h.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── COMMUNICATION TAB ── */}
          {activeTab === "comments" && (
            <div className="flex gap-4">

              {/* Left: Thread + Compose */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Resolution banner */}
                {pendingStatus && (
                  <div className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
                    pendingStatus === "solved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}>
                    <span className="text-lg shrink-0">{pendingStatus === "solved" ? "✅" : "❌"}</span>
                    <div>
                      <p className={`text-xs font-bold ${pendingStatus === "solved" ? "text-green-700" : "text-red-700"}`}>
                        Resolution comment required to mark as {pendingStatus.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please describe the resolution or reason for failure before confirming.
                      </p>
                    </div>
                    <button onClick={() => setPendingStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Comment thread */}
                <div className="space-y-3 min-h-[120px]">
                  {comments.length === 0 && !pendingStatus && (
                    <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the conversation.</p>
                  )}
                  {comments.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-3 border ${
                        c.type === "internal" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{c.author}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.type === "internal" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"
                          }`}>
                            {c.type === "internal" ? "🔒 INTERNAL" : "🌐 PUBLIC"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{timeAgo(c.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{c.text}</p>
                    </div>
                  ))}
                </div>

                {/* Compose */}
                <div className={`border rounded-xl overflow-hidden ${pendingStatus ? "border-orange-300 ring-2 ring-orange-100" : "border-slate-200"}`}>
                  <div className="flex border-b border-slate-200">
                    {(["internal", "public"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setCommentType(t)}
                        className={`flex-1 py-2 text-xs font-semibold transition-all capitalize ${
                          commentType === t
                            ? t === "internal" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {t === "internal" ? "🔒 Internal Note" : "🌐 Public Reply"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={
                      pendingStatus
                        ? `Describe the ${pendingStatus === "solved" ? "resolution" : "reason for failure"} before confirming...`
                        : commentType === "internal"
                        ? "Write an internal note visible only to the team..."
                        : "Write a public reply visible to the customer..."
                    }
                    className="w-full p-3 text-sm text-slate-700 resize-none outline-none min-h-[80px] bg-white"
                  />
                  <div className="flex justify-end px-3 pb-3 gap-2">
                    {pendingStatus && (
                      <button
                        onClick={() => setPendingStatus(null)}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleComment}
                      disabled={!newComment.trim()}
                      className={`px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-40 transition-colors ${
                        pendingStatus === "solved"
                          ? "bg-green-600 hover:bg-green-700"
                          : pendingStatus === "failed"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-slate-900 hover:bg-slate-700"
                      }`}
                    >
                      {pendingStatus ? `Confirm & Mark ${pendingStatus.toUpperCase()}` : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: People sidebar */}
              <div className="w-52 shrink-0 flex flex-col gap-4">

                {/* Creator */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Creator</p>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">Admin</p>
                      <p className="text-[10px] text-slate-400 truncate">admin@ceivo.io</p>
                    </div>
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assignees</p>
                  <div className="space-y-1.5">
                    {[ticket.assignee].map((a, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {(a.fallback || a.name?.charAt(0) || "?").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{a.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{a.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Followers */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Followers</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "John Doe",    email: "john.doe@ceivo.io",    fallback: "JD" },
                      { name: "Sarah Smith", email: "sarah.smith@ceivo.io", fallback: "SS" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {f.fallback}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{f.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}