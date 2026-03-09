/**
 * types/index.ts — Single source of truth for ALL frontend domain types.
 *
 * For raw API response shapes see types/api.ts.
 * For UI styling constants see lib/config.ts.
 * Import from '@/types' everywhere — do not define inline types in pages.
 */

// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role = 'user' | 'assignee' | 'admin';

/** Alias kept for backward-compatibility with lib/menu-config and components. */
export type UserRole = Role;
export type UserStatus = 'active' | 'suspended';

// ─── Ticket status ────────────────────────────────────────────────────────────

/**
 * Lowercase ticket status used in UI components / local state.
 * DB status names (Title-case) live in ApiStatusName from '@/types/api'.
 */
export type TicketStatus =
  | 'draft'
  | 'new'
  | 'assigned'
  | 'solving'
  | 'solved'
  | 'failed'
  | 'renew';

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  user_name: string | null;
  full_name: string | null;
  role: Role;
  avatar?: string | null;
}

// ─── Assignee display (used in UI cards / dashboards) ────────────────────────

export interface DashboardAssignee {
  name:       string;
  avatar?:    string;
  fallback:   string;
  role:       string;
  department: string;
}

// ─── Managed user (admin user-management page) ────────────────────────────────

export interface ManagedUser {
  id:            string;
  name:          string;
  email:         string;
  fallback:      string;
  role:          UserRole;
  status:        UserStatus;
  scopes:        string[];
  joinedAt:      Date;
  ticketCount:   number;
  resolvedCount: number;
  lastActive:    Date;
}

// ─── User-facing ticket (My Requests page) ────────────────────────────────────

/** Simplified shape used to render the end-user's ticket list and detail view. */
export interface UserTicket {
  ticketId:           string;
  title:              string;
  category:           string | null;
  date:               Date;
  status:             TicketStatus;
  description?:       string;
  suggestedSolution?: string | null;
  originalMessage?:   string | null;
  assignee:    { name: string; avatar?: string; fallback: string };
  creator:     { name: string; avatar?: string; fallback: string; role?: string };
  followers:   { name: string; avatar?: string; fallback: string }[];
}

// ─── Person (avatar display) ──────────────────────────────────────────────────

export interface Person {
  name:    string;
  avatar?: string;
  fallback: string;
  role?:   string;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export type CommentVisibility = 'PUBLIC' | 'PRIVATE';

/** Full API-mapped comment (ticket detail — all roles). */
export interface Comment {
  comment_id: number;
  ticket_id:  number | string;
  author:     Pick<User, 'user_id' | 'user_name' | 'role'>;
  content:    string;
  visibility: CommentVisibility;
  createdAt:  string;
}

/** Lightweight comment shown in the user-facing My Requests modal. */
export interface TicketComment {
  id:         string;
  ticketId:   string;
  author:     Person;
  body:       string;
  createdAt:  Date;
  isInternal: boolean;
}

/** Comment shape used in the assignee ticket detail view. */
export interface AssigneeTicketComment {
  author:    string;
  type:      'internal' | 'public';
  text:      string;
  timestamp: Date;
}

// ─── Assignee ticket (assignee ticket detail page) ────────────────────────────

export interface TicketHistoryEntry {
  type?:        'status_change' | 'reassignment';
  action:       string;
  oldStatus:    TicketStatus | null;
  newStatus:    TicketStatus;
  by:           string;
  oldAssignee?: string | null;
  newAssignee?: string;
  detail?:      string;
  timestamp:    Date;
}

export interface AssigneeTicket {
  ticketId:  string;
  title:     string;
  category:  string;
  status:    TicketStatus;
  priority:  TicketPriority;
  date:      Date;
  deadline:  Date;
  assignee:  DashboardAssignee;
  creator:   string;
  followers: DashboardAssignee[];
  history:   TicketHistoryEntry[];
  comments:  AssigneeTicketComment[];
}

export interface AssigneeResolvedTicket {
  ticketId:     string;
  title:        string;
  category:     string;
  status:       'solved' | 'failed';
  priority:     TicketPriority;
  date:         Date;
  resolvedDate: Date;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}