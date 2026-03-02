// Shared API types for the admin report page and all modal components.
// The shape matches the response of GET /reporting/admin/metrics.

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

export interface ApiMetrics {
  total_tickets:           number;
  tickets_by_status:       ApiStatusCount[];
  avg_resolution_time_hrs: number;    // ← field name from controller
  avg_resolution_time_hours: number;  // alias — controller actually returns this key
  top_categories:          ApiCategoryCount[];
  current_backlog:         number;
  assignee_workload:       ApiAssigneeWorkload[];
}

// DB status_id → UI status name
export const STATUS_ID_MAP: Partial<Record<number, string>> = {
  1: 'draft',
  2: 'new',
  3: 'assigned',
  4: 'solving',
  5: 'solved',
  6: 'failed',
  7: 'renew',
};

// UI status name → DB status_id
export const STATUS_NAME_TO_ID: Record<string, number> = {
  draft:    1,
  new:      2,
  assigned: 3,
  solving:  4,
  solved:   5,
  failed:   6,
  renew:    7,
};

// UI period label → API `?period=` param (backend supports last_7_days / last_30_days only)
export function periodToApiParam(p: string): string {
  if (p === 'Last 7 days')  return 'last_7_days';
  if (p === 'Last 30 days') return 'last_30_days';
  return ''; // Last 90 days / This year → no date filter (all_time) on backend
}

// Build initials fallback from a full name
export function nameFallback(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}
