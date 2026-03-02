/**
 * types/api.ts — Single source of truth for all backend API response shapes.
 *
 * These interfaces mirror what the Express/Prisma backend returns.
 * Update here when the backend schema changes; import from '@/types/api'
 * everywhere in the frontend instead of defining inline types in pages.
 */

// ─── Lookup / Reference types ─────────────────────────────────────────────────

export interface ApiCategory {
  category_id: number;
  name: string;
  sla_hours: number;
  description: string | null;
  is_active: boolean;
}

export interface ApiTicketStatus {
  status_id: number;
  name: string;
  step_order: number;
  description: string | null;
  is_active: boolean;
}

export interface ApiScope {
  scope_id: number;
  assignee_id: string;
  scope_name: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  user_id: string;
  email: string;
  full_name: string | null;
  user_name: string | null;
  role: string;
  is_active?: boolean;
  onboarding_completed?: boolean;
  scopes?: ApiScope[];
}

/** Alias — same shape as ApiUser but scoped to assignee context. */
export type ApiAssignee = Pick<ApiUser, 'user_id' | 'email' | 'full_name' | 'user_name'>;

// ─── Ticket ───────────────────────────────────────────────────────────────────

export type ApiPriority = 'Low' | 'Medium' | 'High' | 'Critical';

/** The real status names as stored in the DB ticket_statuses table. */
export type ApiStatusName =
  | 'Draft'
  | 'New'
  | 'Assigned'
  | 'Solving'
  | 'Solved'
  | 'Failed'
  | 'Renew';

/** DB status_id → status name */
export const STATUS_ID_MAP: Partial<Record<number, ApiStatusName>> = {
  1: 'Draft',
  2: 'New',
  3: 'Assigned',
  4: 'Solving',
  5: 'Solved',
  6: 'Failed',
  7: 'Renew',
};

/** Status name → DB status_id */
export const STATUS_NAME_TO_ID: Record<ApiStatusName, number> = {
  Draft:    1,
  New:      2,
  Assigned: 3,
  Solving:  4,
  Solved:   5,
  Failed:   6,
  Renew:    7,
};

export interface ApiTicketRequest {
  request: {
    email: string;
    message: string | null;
    tracking_id: string;
  } | null;
}

/** Full ticket object returned by most list and detail endpoints. */
export interface ApiTicket {
  ticket_id: number;
  title: string;
  summary: string | null;
  suggested_solution: string | null;
  priority: ApiPriority;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  deadline: string | null;
  resolved_at: string | null;
  status_id: number | null;
  category_id: number | null;
  creator_user_id: string | null;
  assignee_user_id: string | null;
  parent_ticket_id?: number | null;
  // Relations (present when backend uses `include:`)
  status: { status_id?: number; name: ApiStatusName } | null;
  category: ApiCategory | null;
  assignee: ApiUser | null;
  creator?: ApiUser | null;
  ticket_requests?: ApiTicketRequest[];
  comments?: ApiComment[];
  followers?: Array<{ user: ApiUser }>;
}

/**
 * Lightweight ticket shape used in list views and dashboards.
 * Omits heavy relations that are only loaded on a detail view.
 */
export type ApiTicketSummary = Pick<
  ApiTicket,
  | 'ticket_id'
  | 'title'
  | 'summary'
  | 'priority'
  | 'created_at'
  | 'updated_at'
  | 'deadline'
  | 'status'
  | 'category'
  | 'assignee'
>;

/** Draft-specific view — same as ApiTicket but commonly used for draft queue. */
export type ApiDraft = ApiTicket;

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Comments use `visibility` (not `is_internal`) — matches db.service.ts */
export interface ApiComment {
  comment_id: number;
  ticket_id: number;
  user_id: string;
  content: string;
  /** "PUBLIC" = visible to everyone. "PRIVATE" = internal staff only. */
  visibility: 'PUBLIC' | 'PRIVATE';
  created_at: string;
  user?: ApiUser;
}

// ─── Audit history ────────────────────────────────────────────────────────────

export interface ApiStatusHistory {
  history_id: number;
  ticket_id?: number;
  changed_at: string;
  old_status:  { name: ApiStatusName } | null;
  new_status:  { name: ApiStatusName } | null;
  changed_by:  ApiUser | null;
  change_reason?: string | null;
}

export interface ApiAssignmentHistory {
  assignment_id?: number;
  ticket_id?: number;
  changed_at:   string;
  old_assignee: ApiUser | null;
  new_assignee: ApiUser | null;
  changed_by:   ApiUser | null;
  change_reason?: string | null;
}

/** Unified timeline entry returned by GET /tickets/:id/history */
export interface ApiHistoryEntry {
  type: 'status_change' | 'assignment_change';
  timestamp: string;
  old_status?: string | null;
  new_status?: string | null;
  old_assignee?: { user_id: string; name: string } | null;
  new_assignee?: { user_id: string; name: string } | null;
  changed_by: { user_id: string; name: string } | null;
  change_reason?: string | null;
}

export interface ApiTicketHistory {
  ticket_id: number;
  history: ApiHistoryEntry[];
}

// ─── Ticket detail (rich, includes all relations) ─────────────────────────────

export interface ApiTicketDetail extends ApiTicket {
  status_history:     ApiStatusHistory[];
  assignment_history: ApiAssignmentHistory[];
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export interface ApiStatusCount {
  status_id: number;
  count:     number;
}

export interface ApiCategoryCount {
  category_id:   number | null;
  category_name: string;
  count:         number;
}

export interface ApiAssigneeWorkload {
  assignee_id:    string;
  assignee_name:  string;
  active_tickets: number;
}

/** Response from GET /reporting/admin/metrics */
export interface ApiMetrics {
  total_tickets:             number;
  tickets_by_status:         ApiStatusCount[];
  avg_resolution_time_hours: number;
  top_categories:            ApiCategoryCount[];
  current_backlog:           number;
  assignee_workload:         ApiAssigneeWorkload[];
}

/** Response from GET /reporting/assignee/workload */
export interface ApiWorkloadResponse {
  assignee_id: string;
  workload: {
    total_active_tickets:     number;
    status_breakdown:         Record<string, number>;
    upcoming_deadlines_count: number;
    overdue_count:            number;
  };
  tickets: ApiTicket[];
}

/** Response from GET /reporting/assignee/performance */
export interface ApiPerformanceResponse {
  assignee_id: string;
  period: string;
  performance: {
    total_solved:               number;
    total_failed:               number;
    success_rate:               string;
    avg_resolution_time_hours:  number | null;
    resolved_by_category:       { category_name: string; count: number }[];
  };
}

/** Response from GET /reporting/admin/category-trends */
export interface ApiCategoryTrends {
  period_days: number;
  start_date: string;
  trends: Record<string, Record<string, number>>; // category → date → count
}

// ─── Admin stats (legacy alias for ApiMetrics, kept for compatibility) ────────

export interface ApiAdminStats {
  total_tickets: number;
  tickets_by_status: Record<string, number>;
  avg_resolution_time_hours: number;
  top_categories: { name: string; count: number }[];
  current_backlog: number;
}

// ─── Utility functions (API-layer helpers used alongside these types) ─────────

/** Map a UI period label to the backend `?period=` query param. */
export function periodToApiParam(p: string): string {
  if (p === 'Last 7 days')  return 'last_7_days';
  if (p === 'Last 30 days') return 'last_30_days';
  return ''; // Last 90 days / This year → no date filter (all_time) on backend
}

/** Build an initials fallback string from a full name. */
export function nameFallback(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface ApiNotification {
  notification_id: number;
  ticket_id: number;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ticket?: ApiTicket;
}
