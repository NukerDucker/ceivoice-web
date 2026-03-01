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

interface UserTicket {
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