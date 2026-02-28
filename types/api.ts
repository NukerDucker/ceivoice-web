// types/api.ts — mirrors backend Prisma responses
// Update this file when the backend schema changes

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

export interface ApiUser {
  user_id: string;
  email: string;
  full_name: string | null;
  user_name: string | null;
  role: string;
}

export interface ApiTicket {
  ticket_id: number;
  title: string;
  summary: string | null;
  suggested_solution: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  deadline: string | null;
  resolved_at: string | null;
  status_id: number;
  category_id: number | null;
  creator_user_id: string | null;
  assignee_user_id: string | null;
  // Relations (included when backend uses `include:`)
  status: ApiTicketStatus | null;
  category: ApiCategory | null;
  assignee: ApiUser | null;
  creator?: ApiUser | null;
}

export interface ApiComment {
  comment_id: number;
  ticket_id: number;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface ApiAdminStats {
  total_tickets: number;
  tickets_by_status: Record<string, number>;
  avg_resolution_time_hours: number;
  top_categories: { name: string; count: number }[];
  current_backlog: number;
}
