/**
 * types/index.ts — Single source of truth for domain-level types.
 *
 * For API response shapes (what the backend returns as JSON), see types/api.ts.
 * Import from '@/types' or '@/types/api' instead of defining inline types in pages.
 */

// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role = 'user' | 'assignee' | 'admin';

/** Alias kept for compatibility with lib/menu-config and components. */
export type UserRole = Role;

// ─── Ticket status ────────────────────────────────────────────────────────────

/**
 * Real ticket status names — matches the DB `ticket_statuses` table exactly.
 * For status_id lookups use STATUS_ID_MAP from '@/types/api'.
 */
export type TicketStatus =
  | 'Draft'
  | 'New'
  | 'Assigned'
  | 'Solving'
  | 'Solved'
  | 'Failed'
  | 'Renew';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  user_name: string | null;
  full_name: string | null;
  role: Role;
  avatar?: string | null;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export type CommentVisibility = 'PUBLIC' | 'PRIVATE';

export interface Comment {
  comment_id: number;
  ticket_id: number | string;
  author: Pick<User, 'user_id' | 'user_name' | 'role'>;
  content: string;
  visibility: CommentVisibility;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
