"use client";

import React, { useState, useMemo } from "react";
import { Bell, ClipboardList, X, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/layout/AssigneeSidebar";
import { Header } from "@/components/layout/Navbar";
import {
  MY_ACTIVE_TICKETS,
  MY_RESOLVED_TICKETS,
  ASSIGNEE_PERFORMANCE,
  OTHER_ASSIGNEES,
  CURRENT_ASSIGNEE,
  getCatStyle,
  PRIORITY_STYLE,
  STATUS_STYLES,
  type AssigneeTicket,
  type TicketHistoryEntry,
} from "@/lib/assignee-dashboard-data";

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STYLE MAPS  (status labels not in STATUS_STYLES from admin data)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
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

function timeAgo(date: Date | string) {
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeUntil(date: Date | string) {
  const diff = new Date(date).getTime() - now.getTime();
  if (diff < 0) return { label: "OVERDUE", urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 24) return { label: `${h}h ${m}m`, urgent: h < 6 };
  return { label: `${Math.floor(h / 24)}d ${h % 24}h`, urgent: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 8 }: { user: { name?: string; fallback?: string }; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
    >
      {(user.fallback || user.name?.charAt(0) || "?").toUpperCase()}
    </div>
  );
}

function StatCard({
  label, value, sub, subColor, bgColor,
}: {
  label: string; value: string | number; sub: string;
  subColor: string; bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bgColor }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKET DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

function TicketDetailModal({
  ticket, onClose, onUpdate,
}: {
  ticket: AssigneeTicket;
  onClose: () => void;
  onUpdate: (ticketId: string, updates: Partial<AssigneeTicket>) => void;
}) {
  const [status, setStatus] = useState(ticket.status);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<"internal" | "public">("internal");
  const [comments, setComments] = useState(ticket.comments);
  const [history, setHistory] = useState(ticket.history);
  const [showReassign, setShowReassign] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "history" | "comments">("details");
  const [pendingStatus, setPendingStatus] = useState<"solved" | "failed" | null>(null);

  const statusOptions = ["assigned", "solving", "solved", "failed"] as const;
  const isResolutionStatus = (s: string) => s === "solved" || s === "failed";

  const handleStatusChange = (newStatus: typeof statusOptions[number]) => {
    // SOLVED / FAILED require a resolution comment first
    if (isResolutionStatus(newStatus) && newStatus !== status) {
      setPendingStatus(newStatus as "solved" | "failed");
      setActiveTab("comments");
      return;
    }
    commitStatusChange(newStatus);
  };

  const commitStatusChange = (newStatus: typeof statusOptions[number]) => {
    const entry: TicketHistoryEntry = {
      action: "Status Change",
      oldStatus: status,
      newStatus,
      by: CURRENT_ASSIGNEE.name,
      timestamp: new Date(),
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setStatus(newStatus);
    setPendingStatus(null);
    onUpdate(ticket.ticketId, { status: newStatus, history: updatedHistory });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      author: CURRENT_ASSIGNEE.name,
      type: commentType,
      text: newComment.trim(),
      timestamp: new Date(),
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
    // If there's a pending resolution status, commit it now
    if (pendingStatus) {
      commitStatusChange(pendingStatus);
    }
  };

  const handleReassign = () => {
    if (selectedAssignees.length === 0) return;
    const entry: TicketHistoryEntry = {
      action: "Reassigned",
      oldStatus: status,
      newStatus: status,
      by: CURRENT_ASSIGNEE.name,
      detail: `Reassigned to: ${selectedAssignees.join(", ")}`,
      timestamp: new Date(),
    };
    setHistory((prev) => [...prev, entry]);
    setShowReassign(false);
    setSelectedAssignees([]);
  };

  const cs = getCatStyle(ticket.category);
  const timeLeft = timeUntil(ticket.deadline);
  const statusStyle = STATUS_STYLES[status];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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

        {/* Tabs */}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (
            <div className="space-y-5">
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

              {/* Status Controls */}
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
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: oldSt.bg, color: oldSt.text }}
                              >
                                {STATUS_LABEL[h.oldStatus!]}
                              </span>
                              <span className="text-slate-400 text-xs">→</span>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: newSt.bg, color: newSt.text }}
                              >
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

              {/* ── Left: Thread + Compose ── */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Resolution comment required banner */}
                {pendingStatus && (
                  <div className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
                    pendingStatus === "solved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
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
                    <button
                      onClick={() => setPendingStatus(null)}
                      className="ml-auto text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Comment thread */}
                <div className="space-y-3 min-h-[120px]">
                  {comments.length === 0 && !pendingStatus && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No comments yet. Start the conversation.
                    </p>
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
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.type === "internal" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"
                            }`}
                          >
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
                      {pendingStatus
                        ? `Confirm & Mark ${pendingStatus.toUpperCase()}`
                        : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Right: People sidebar ── */}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AssigneeDashboardPage() {
  const [tickets, setTickets] = useState<AssigneeTicket[]>(MY_ACTIVE_TICKETS);
  const [sortBy, setSortBy] = useState<"deadline" | "priority">("deadline");
  const [selectedTicket, setSelectedTicket] = useState<AssigneeTicket | null>(null);

  const activeTickets = useMemo(() => {
    return [...tickets]
      .filter((t) => t.status !== "solved" && t.status !== "failed")
      .sort((a, b) => {
        if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
  }, [tickets, sortBy]);

  const handleTicketUpdate = (ticketId: string, updates: Partial<AssigneeTicket>) => {
    setTickets((prev) => prev.map((t) => t.ticketId === ticketId ? { ...t, ...updates } : t));
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, ...updates } : prev);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar ── */}
      <div className="flex flex-col h-screen shrink-0">
        <Sidebar
          userName={CURRENT_ASSIGNEE.name}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">

          {/* Header */}
          <Header />

          <div className="px-8 py-6 space-y-5">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="My Active Tickets"
                value={ASSIGNEE_PERFORMANCE.activeCount}
                sub="Currently assigned to you"
                subColor="#6366f1"
                bgColor="#dbeafe"
              />
              <StatCard
                label="Critical / Urgent"
                value={ASSIGNEE_PERFORMANCE.criticalCount}
                sub="Need immediate action"
                subColor="#ef4444"
                bgColor="#fef3c2"
              />
              <StatCard
                label="Resolved (30 days)"
                value={ASSIGNEE_PERFORMANCE.closedLast30}
                sub={`${ASSIGNEE_PERFORMANCE.solvedLast30} solved · ${ASSIGNEE_PERFORMANCE.failedLast30} failed`}
                subColor="#10b981"
                bgColor="#dcfce7"
              />
              <StatCard
                label="Avg Response Time"
                value={`${ASSIGNEE_PERFORMANCE.avgFirstResponseHours}h`}
                sub="First response average"
                subColor="#10b981"
                bgColor="#e9d5ff"
              />
            </div>

            {/* ── Active Workload ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <ClipboardList size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Active Workload</h3>
                    <p className="text-xs text-slate-500">Your open tickets sorted by urgency — solved & failed excluded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                  <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    {([{ key: "deadline", label: "Deadline" }, { key: "priority", label: "Priority" }] as const).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                        style={{
                          background: sortBy === opt.key ? "#fff" : "transparent",
                          color: sortBy === opt.key ? "#0f172a" : "#64748b",
                          boxShadow: sortBy === opt.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeTickets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm font-semibold text-slate-500">All caught up! No active tickets.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeTickets.map((t) => {
                    const cs = getCatStyle(t.category);
                    const st = STATUS_STYLES[t.status];
                    const pr = PRIORITY_STYLE[t.priority];
                    const timeLeft = timeUntil(t.deadline);
                    return (
                      <div
                        key={t.ticketId}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedTicket(t)}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pr.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400">{t.ticketId}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>
                              {t.category}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {t.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Opened {timeAgo(t.date)}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-center">
                          <p className="text-[10px] text-slate-400 mb-1">Time remaining</p>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${timeLeft.urgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                            {timeLeft.urgent && "⚠ "}{timeLeft.label}
                          </span>
                        </div>
                        <div className="shrink-0 flex flex-col items-center">
                          <p className="text-[10px] text-slate-400 mb-1">Status</p>
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: st.bg, color: st.text }}>
                            {STATUS_LABEL[t.status]}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Personal Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full" />
                  <h3 className="text-base font-bold text-slate-900">My Performance (30 days)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Total Volume",  value: ASSIGNEE_PERFORMANCE.totalAssigned,  color: "#6366f1", bg: "#eef2ff" },
                    { label: "Resolved",      value: ASSIGNEE_PERFORMANCE.solvedLast30,   color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Failed",        value: ASSIGNEE_PERFORMANCE.failedLast30,   color: "#ef4444", bg: "#fef2f2" },
                    { label: "In Progress",   value: ASSIGNEE_PERFORMANCE.activeCount,    color: "#f59e0b", bg: "#fffbeb" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 border border-slate-100" style={{ background: s.bg }}>
                      <p className="text-3xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">Resolution Rate</span>
                    <span className="font-bold text-slate-700">{ASSIGNEE_PERFORMANCE.resolutionRatePct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${ASSIGNEE_PERFORMANCE.resolutionRatePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Last 30 days</span>
                </div>
                <div className="space-y-3">
                  {MY_RESOLVED_TICKETS.map((t, i) => {
                    const st = STATUS_STYLES[t.status];
                    const cs = getCatStyle(t.category);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: st.bg }}>
                          <span style={{ color: st.text }}>{t.status === "solved" ? "✓" : "✗"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>
                              {t.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo(t.resolvedDate)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.text }}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Ticket Detail Modal ── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  );
}