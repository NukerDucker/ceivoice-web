/**
 * lib/constants.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-export point for legacy mock data.
 * All mock data now originates in web-temp/index.ts (single source of truth).
 * Maintained for backwards compatibility with older code.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Legacy interfaces kept for backwards compatibility
interface User {
  firstName: string;
  lastName: string;
  userName: string;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  date: Date;
  status: string;
  assignee: User;
}

export interface UserTicket {
  ticketId: string;
  title: string;
  category: string | null;
  date: Date;
  status: 'submitted' | 'in-progress' | 'resolved' | 'critical';
  assignee: {
    name: string;
    avatar?: string;
    fallback: string;
  };
}

// Re-export from web-temp (single source of truth)
export { LEGACY_MOCK_USERS as mockUsers, LEGACY_MOCK_TICKETS as mockTickets } from '@/web-temp/index';

// ─── Mock User Tickets ────────────────────────────────────────────────────────

export const MOCK_USER_TICKETS: UserTicket[] = [
  {
    ticketId: 'REQ-001',
    title: 'Laptop screen flickering issue',
    category: 'Hardware',
    date: new Date('2025-02-10'),
    status: 'in-progress',
    assignee: { name: 'Somsak Jaidee', fallback: 'SJ' },
  },
  {
    ticketId: 'REQ-002',
    title: 'Cannot access internal HR portal',
    category: 'Software',
    date: new Date('2025-02-14'),
    status: 'submitted',
    assignee: { name: 'Unassigned', fallback: 'UA' },
  },
  {
    ticketId: 'REQ-003',
    title: 'Request for Adobe Creative Cloud license',
    category: 'Software',
    date: new Date('2025-01-28'),
    status: 'resolved',
    assignee: { name: 'Nipa Thong', fallback: 'NT' },
  },
  {
    ticketId: 'REQ-004',
    title: 'VPN connection drops every 30 minutes',
    category: 'Network',
    date: new Date('2025-02-18'),
    status: 'critical',
    assignee: { name: 'Krit Sombat', fallback: 'KS' },
  },
  {
    ticketId: 'REQ-005',
    title: 'New employee onboarding equipment setup',
    category: 'Hardware',
    date: new Date('2025-01-15'),
    status: 'resolved',
    assignee: { name: 'Somsak Jaidee', fallback: 'SJ' },
  },
  {
    ticketId: 'REQ-006',
    title: 'Printer on 3rd floor not responding',
    category: 'Hardware',
    date: new Date('2025-02-20'),
    status: 'submitted',
    assignee: { name: 'Unassigned', fallback: 'UA' },
  },
];