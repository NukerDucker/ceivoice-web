// Centralised type definitions for CeiVoice

// ─── Roles ──────────────────────────────────────────────────────────────────

export type Role = 'user' | 'assignee' | 'admin';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  user_name: string | null;
  full_name: string | null;
  role: Role;
  avatar?: string | null;
}

// ─── Ticket ──────────────────────────────────────────────────────────────────

export type TicketStatus = 'submitted' | 'in-progress' | 'resolved' | 'critical';

export interface Ticket {
  ticketId: string;
  title: string;
  description?: string;
  category: string | null;
  status: TicketStatus;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
  submittedBy?: Pick<User, 'user_id' | 'user_name' | 'email'>;
  assignee?: Pick<User, 'user_id' | 'user_name'> & { avatar?: string; fallback: string };
}

// ─── Comment / Reply ─────────────────────────────────────────────────────────

export interface Comment {
  comment_id: number;
  ticket_id: string;
  author: Pick<User, 'user_id' | 'user_name' | 'role'>;
  content: string;
  createdAt: string;
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
