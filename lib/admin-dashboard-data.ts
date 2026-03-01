/**
 * lib/admin-dashboard-data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-export point for admin dashboard data.
 * All mock data originates in web-temp/index.ts (single source of truth).
 * UI configuration styles live here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Re-export all mock data from web-temp (single source of truth)
export {
  // Types
  type TicketStatus,
  type TicketPriority,
  type UserRole,
  type UserStatus,
  type CommentType,
  type DashboardAssignee,
  type DashboardTicket,
  type AISuggestion,
  type OriginalMessage,
  type ManagedUser,
  type TicketComment,
  type TicketHistoryEntry,
  type AssigneeTicket,
  type ResolvedTicket,
  type MockTableTicket,
  // Mock data
  MOCK_ASSIGNEES as DASHBOARD_ASSIGNEES,
  MOCK_TICKETS as DASHBOARD_TICKETS,
  MOCK_AI_SUGGESTIONS as AI_SUGGESTIONS,
  MOCK_ORIGINAL_MESSAGES as ORIGINAL_MESSAGES,
  MOCK_MANAGED_USERS as MANAGED_USERS,
  MOCK_ACTIVE_TICKETS,
  SCOPE_NAMES,
} from '@/web-temp/index';

// ─────────────────────────────────────────────────────────────────────────────
// UI CONFIGURATION  (styles for tickets, statuses, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  new:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  assigned: { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  solving:  { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  solved:   { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  failed:   { bg: '#FFF1F2', text: '#E11D48', dot: '#F43F5E' },
  renew:    { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
};

export interface BacklogStatusMeta {
  label: string;
  target: string;
}

export const BACKLOG_STATUS_META: Record<string, BacklogStatusMeta> = {
  draft:    { label: 'Draft',    target: '< 1h' },
  new:      { label: 'New',      target: '< 4h' },
  assigned: { label: 'Assigned', target: '< 8h' },
  solving:  { label: 'Solving',  target: '< 1d' },
  solved:   { label: 'Solved',   target: 'done' },
  failed:   { label: 'Failed',   target: 'done' },
  renew:    { label: 'Renew',    target: '< 4h' },
};

export const BACKLOG_PERIODS: string[] = [
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This year',
];