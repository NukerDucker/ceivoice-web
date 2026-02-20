import { DASHBOARD_TICKETS } from "./admin-dashboard-data";
import type { TicketStatus } from "./admin-dashboard-data";

// ─────────────────────────────────────────────────────────────────────────────
// STYLE MAPS
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_STYLE: Record<
  TicketStatus,
  { bg: string; color: string; label: string }
> = {
  submitted:     { bg: "#dbeafe", color: "#1d4ed8", label: "SUBMITTED"   },
  "in-progress": { bg: "#e0e7ff", color: "#4338ca", label: "IN PROGRESS" },
  resolved:      { bg: "#dcfce7", color: "#15803d", label: "RESOLVED"    },
  critical:      { bg: "#fee2e2", color: "#b91c1c", label: "CRITICAL"    },
};

export const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  Network:        { bg: "#dbeafe", color: "#1d4ed8" },
  Email:          { bg: "#fce7f3", color: "#be185d" },
  Database:       { bg: "#ede9fe", color: "#7c3aed" },
  Security:       { bg: "#fee2e2", color: "#b91c1c" },
  Performance:    { bg: "#ffedd5", color: "#c2410c" },
  Authentication: { bg: "#fef9c3", color: "#a16207" },
  Storage:        { bg: "#dcfce7", color: "#15803d" },
  Mobile:         { bg: "#e0f2fe", color: "#0369a1" },
};

export const CATEGORY_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6",
];

export function getCatStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? { bg: "#f3f4f6", color: "#4b5563" };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED STATS  (computed once from DASHBOARD_TICKETS)
// ─────────────────────────────────────────────────────────────────────────────

export const totalTickets    = DASHBOARD_TICKETS.length;
export const draftTickets    = DASHBOARD_TICKETS.filter((t) => t.status === "submitted");
export const activeTickets   = DASHBOARD_TICKETS.filter((t) => t.status === "in-progress");
export const resolvedTickets = DASHBOARD_TICKETS.filter((t) => t.status === "resolved");
export const criticalTickets = DASHBOARD_TICKETS.filter((t) => t.status === "critical");

/** Category breakdown for the donut chart */
export const categoryData = (() => {
  const map: Record<string, number> = {};
  DASHBOARD_TICKETS.forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + 1;
  });
  return Object.entries(map).map(([label, value], i) => ({
    label,
    value,
    pct: Math.round((value / totalTickets) * 100),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
})();

/** Weekly ticket counts for the bar chart (last 4 weeks) */
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