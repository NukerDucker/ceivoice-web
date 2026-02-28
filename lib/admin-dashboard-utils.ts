import { DASHBOARD_TICKETS, STATUS_STYLES } from "./admin-dashboard-data";
import type { TicketStatus } from "./admin-dashboard-data";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS STYLE
// keys: draft / new / assigned / solving / solved / failed / renew
// shape: { bg, text, dot }
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_STYLE = STATUS_STYLES;

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY STYLE
// keys: critical / high / medium / low
// ─────────────────────────────────────────────────────────────────────────────

export const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: "#fee2e2", color: "#b91c1c", label: "CRITICAL" },
  high:     { bg: "#fef3c2", color: "#d97706", label: "HIGH"     },
  medium:   { bg: "#dbeafe", color: "#1d4ed8", label: "MEDIUM"   },
  low:      { bg: "#f0fdf4", color: "#15803d", label: "LOW"      },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY SORT ORDER  (critical = highest urgency)
// use: tickets.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
// ─────────────────────────────────────────────────────────────────────────────

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNEE STATUS STYLE
// derived at runtime from each assignee's tickets — style only lives here
// ─────────────────────────────────────────────────────────────────────────────

export const ASSIGNEE_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: "#fee2e2", color: "#b91c1c" },
  ACTIVE:   { bg: "#dcfce7", color: "#15803d" },
  IDLE:     { bg: "#f3f4f6", color: "#6b7280" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY STYLE
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  Network:        { bg: "#dbeafe", color: "#1d4ed8" },
  Email:          { bg: "#fce7f3", color: "#be185d" },
  Database:       { bg: "#ede9fe", color: "#7c3aed" },
  Security:       { bg: "#fee2e2", color: "#b91c1c" },
  Performance:    { bg: "#ffedd5", color: "#c2410c" },
  Authentication: { bg: "#fef9c3", color: "#a16207" },
  Storage:        { bg: "#dcfce7", color: "#15803d" },
  Mobile:         { bg: "#e0f2fe", color: "#0369a1" },
  Facilities:     { bg: "#fff7ed", color: "#c2410c" },
};

export const CATEGORY_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6",
];

export function getCatStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? { bg: "#f3f4f6", color: "#4b5563" };
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR CHART COLORS  (one per week bar)
// ─────────────────────────────────────────────────────────────────────────────

export const BAR_CHART_COLORS = ["#fde68a", "#bfdbfe", "#ddd6fe", "#a7f3d0"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1)    return "just now";
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED STATS
//
// STATUS  (workflow state)   PRIORITY  (urgency level)
// ─────────────────────────  ──────────────────────────
// draft                      critical
// new                        high
// assigned                   medium
// solving                    low
// solved
// failed
// renew
// ─────────────────────────────────────────────────────────────────────────────

export const totalTickets = DASHBOARD_TICKETS.length;

// ── Status-based filters ─────────────────────────────────────────────────────
export const draftTickets    = DASHBOARD_TICKETS.filter((t) => t.status === "draft");
export const activeTickets   = DASHBOARD_TICKETS.filter((t) =>
  t.status === "new"      ||
  t.status === "assigned" ||
  t.status === "solving"  ||
  t.status === "renew"
);
export const resolvedTickets = DASHBOARD_TICKETS.filter((t) => t.status === "solved");
export const failedTickets   = DASHBOARD_TICKETS.filter((t) => t.status === "failed");

// ── Priority-based filters ───────────────────────────────────────────────────
export const criticalTickets = DASHBOARD_TICKETS.filter((t) => t.priority === "critical");
export const highTickets     = DASHBOARD_TICKETS.filter((t) => t.priority === "high");
export const mediumTickets   = DASHBOARD_TICKETS.filter((t) => t.priority === "medium");
export const lowTickets      = DASHBOARD_TICKETS.filter((t) => t.priority === "low");

// Priority breakdown for workload mini-cards
export const priorityBreakdown = [
  { label: "Critical", value: criticalTickets.length, color: "#ef4444", bg: "#fef2f2" },
  { label: "High",     value: highTickets.length,     color: "#f59e0b", bg: "#fffbeb" },
  { label: "Medium",   value: mediumTickets.length,   color: "#6366f1", bg: "#eef2ff" },
  { label: "Low",      value: lowTickets.length,      color: "#22c55e", bg: "#f0fdf4" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────────────────────────────────────

export const categoryData = (() => {
  const map: Record<string, number> = {};
  DASHBOARD_TICKETS.forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + 1;
  });
  return Object.entries(map).map(([label, value], i) => ({
    label,
    value,
    pct:   Math.round((value / totalTickets) * 100),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
})();

export const weeklyData = (() => {
  const now   = Date.now();
  const weeks = [0, 0, 0, 0];
  DASHBOARD_TICKETS.forEach((t) => {
    const days = Math.floor((now - t.date.getTime()) / 86400000);
    const idx  = Math.min(3, Math.floor(days / 7));
    weeks[3 - idx] += 1;
  });
  return weeks.map((count, i) => ({ week: `Week ${i + 1}`, value: count }));
})();