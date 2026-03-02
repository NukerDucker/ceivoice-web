/**
 * lib/config.ts — Single source of truth for ALL UI configuration constants.
 *
 * Covers: status/priority/category styles, chart colours, scope names,
 * backlog metadata and report period labels.
 *
 * Rules:
 *   - No mock data, no runtime logic — pure static config.
 *   - Import from '@/lib/config' everywhere in page/component code.
 *   - For API type-maps (STATUS_ID_MAP, STATUS_NAME_TO_ID) see '@/types/api'.
 */

import type { TicketStatus, TicketPriority } from '@/types';

// ─── Status styles ────────────────────────────────────────────────────────────

/** Background / text / dot colours for each ticket status badge. */
export const STATUS_STYLES: Record<
  TicketStatus,
  { bg: string; text: string; dot: string }
> = {
  draft:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  new:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  assigned: { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  solving:  { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  solved:   { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  failed:   { bg: '#FFF1F2', text: '#E11D48', dot: '#F43F5E' },
  renew:    { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
};

// ─── Priority styles ──────────────────────────────────────────────────────────

/** Badge colours for each ticket priority level. */
export const PRIORITY_STYLES: Record<
  TicketPriority,
  { bg: string; color: string; dot: string; label: string }
> = {
  critical: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444', label: 'CRITICAL' },
  high:     { bg: '#fef3c2', color: '#d97706', dot: '#f59e0b', label: 'HIGH'     },
  medium:   { bg: '#dbeafe', color: '#1d4ed8', dot: '#38bdf8', label: 'MEDIUM'   },
  low:      { bg: '#f0fdf4', color: '#15803d', dot: '#4ade80', label: 'LOW'      },
};

/** Sort order: smaller number = higher urgency (use in Array.sort comparators). */
export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
};

// ─── Category styles ──────────────────────────────────────────────────────────

export const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  Network:        { bg: '#dbeafe', color: '#1d4ed8' },
  Email:          { bg: '#fce7f3', color: '#be185d' },
  Database:       { bg: '#dbeafe', color: '#1e40af' },
  Security:       { bg: '#fce7f3', color: '#9d174d' },
  Performance:    { bg: '#f0fdf4', color: '#166534' },
  Authentication: { bg: '#ede9fe', color: '#5b21b6' },
  Storage:        { bg: '#fef3c2', color: '#92400e' },
  Mobile:         { bg: '#fdf4ff', color: '#7e22ce' },
  Facilities:     { bg: '#fff7ed', color: '#c2410c' },
  HR:             { bg: '#f0f9ff', color: '#0369a1' },
  Finance:        { bg: '#fef9c3', color: '#a16207' },
  'IT Ops':       { bg: '#e0f2fe', color: '#0369a1' },
  Compliance:     { bg: '#ede9fe', color: '#7c3aed' },
  Infrastructure: { bg: '#f1f5f9', color: '#475569' },
};

/** Ordered palette for chart segments (cycles when category count > 8). */
export const CATEGORY_COLORS: string[] = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6',
];

// ─── Assignee workload badge ──────────────────────────────────────────────────

export const ASSIGNEE_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: '#fee2e2', color: '#b91c1c' },
  ACTIVE:   { bg: '#dcfce7', color: '#15803d' },
  IDLE:     { bg: '#f3f4f6', color: '#6b7280' },
};

// ─── Chart colours ────────────────────────────────────────────────────────────

/** One colour per weekly bar in the ticket-volume chart. */
export const BAR_CHART_COLORS: string[] = ['#fde68a', '#bfdbfe', '#ddd6fe', '#a7f3d0'];

// ─── Backlog panel ────────────────────────────────────────────────────────────

export interface BacklogStatusMeta {
  label:  string;
  target: string;
}

export const BACKLOG_STATUS_META: Record<TicketStatus, BacklogStatusMeta> = {
  draft:    { label: 'Draft',    target: '< 1h' },
  new:      { label: 'New',      target: '< 4h' },
  assigned: { label: 'Assigned', target: '< 8h' },
  solving:  { label: 'Solving',  target: '< 1d' },
  solved:   { label: 'Solved',   target: 'done' },
  failed:   { label: 'Failed',   target: 'done' },
  renew:    { label: 'Renew',    target: '< 4h' },
};

// ─── Report period labels ─────────────────────────────────────────────────────

export const REPORT_PERIODS: string[] = [
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This year',
];

// ─── Scope / category names (used in settings + user-management) ──────────────

export const SCOPE_NAMES: string[] = [
  'Network', 'Security', 'Database', 'Email', 'Performance',
  'Authentication', 'Storage', 'Mobile', 'Facilities',
  'HR', 'Finance', 'IT Ops', 'Compliance', 'Infrastructure',
];
