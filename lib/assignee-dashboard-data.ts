// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNEE DASHBOARD DATA
// Filtered view for the logged-in assignee (Palm Pollapat / DASHBOARD_ASSIGNEES[0])
// Import this in the Assignee Dashboard page instead of hardcoding.
// ─────────────────────────────────────────────────────────────────────────────

import {
  DASHBOARD_TICKETS,
  DASHBOARD_ASSIGNEES,
  STATUS_STYLES,
  type DashboardAssignee,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/admin-dashboard-data';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CommentType = 'internal' | 'public';

export interface TicketComment {
  author:    string;
  type:      CommentType;
  text:      string;
  timestamp: Date;
}

export interface TicketHistoryEntry {
  action:     string;
  oldStatus:  TicketStatus | null;
  newStatus:  TicketStatus;
  by:         string;
  detail?:    string;           // used for reassignment notes
  timestamp:  Date;
}

export interface AssigneeTicket {
  ticketId:    string;
  title:       string;
  category:    string;
  status:      TicketStatus;
  priority:    TicketPriority;
  date:        Date;
  deadline:    Date;
  assignee:    DashboardAssignee;
  history:     TicketHistoryEntry[];
  comments:    TicketComment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT ASSIGNEE  (swap name to match session user in production)
// ─────────────────────────────────────────────────────────────────────────────

export const CURRENT_ASSIGNEE: DashboardAssignee = DASHBOARD_ASSIGNEES[0];
// → { name: 'Palm Pollapat', role: 'Technical Support', department: 'Database', … }

// ─────────────────────────────────────────────────────────────────────────────
// ALL ASSIGNEES  (used in the Reassign picker — excludes current user)
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_ASSIGNEES: DashboardAssignee[] = DASHBOARD_ASSIGNEES;

export const OTHER_ASSIGNEES: DashboardAssignee[] = DASHBOARD_ASSIGNEES.filter(
  (a) => a.name !== CURRENT_ASSIGNEE.name,
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const now = Date.now();
const daysAgo   = (d: number) => new Date(now - d * 86_400_000);
const hoursLater = (h: number) => new Date(now + h * 3_600_000);

// Re-export STATUS_STYLES so the page only needs one import source
export { STATUS_STYLES };

export const PRIORITY_STYLE: Record<TicketPriority, { bg: string; color: string; dot: string }> = {
  critical: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  high:     { bg: '#fef3c2', color: '#92400e', dot: '#f59e0b' },
  medium:   { bg: '#e0f2fe', color: '#0369a1', dot: '#38bdf8' },
  low:      { bg: '#f0fdf4', color: '#166534', dot: '#4ade80' },
};

export const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  Database:       { bg: '#dbeafe', color: '#1e40af' },
  Network:        { bg: '#e0f2fe', color: '#0369a1' },
  Security:       { bg: '#fce7f3', color: '#9d174d' },
  Authentication: { bg: '#ede9fe', color: '#5b21b6' },
  Storage:        { bg: '#fef3c2', color: '#92400e' },
  Performance:    { bg: '#f0fdf4', color: '#166534' },
  Email:          { bg: '#f0f9ff', color: '#075985' },
  Mobile:         { bg: '#fdf4ff', color: '#7e22ce' },
  Facilities:     { bg: '#fff7ed', color: '#c2410c' },
};

export const getCatStyle = (cat: string) =>
  CAT_STYLE[cat] ?? { bg: '#f3f4f6', color: '#374151' };

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE TICKETS  (assigned to current user, status ≠ solved | failed)
// Enriched with deadline, history, and comments.
// ─────────────────────────────────────────────────────────────────────────────

export const MY_ACTIVE_TICKETS: AssigneeTicket[] = [
  {
    // pulled from DASHBOARD_TICKETS TD-001241 (Palm, status: new → elevated to assigned here)
    ticketId: 'TD-001241',
    title:    'Database Connection Pool Exhausted',
    category: 'Database',
    status:   'assigned',
    priority: 'high',
    date:     daysAgo(2),
    deadline: hoursLater(18),
    assignee: CURRENT_ASSIGNEE,
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System',        timestamp: daysAgo(2.1) },
      { action: 'Admin Approved',oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',            timestamp: daysAgo(2)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(1.8) },
    ],
    comments: [
      { author: 'Admin',                  type: 'internal', text: 'Peak load suspected. Please check connection leak first.', timestamp: daysAgo(1.9) },
      { author: CURRENT_ASSIGNEE.name,    type: 'internal', text: 'Acknowledged. Will run a connection audit now.',           timestamp: daysAgo(1.8) },
    ],
  },
  {
    ticketId: 'TD-001267',
    title:    'Office 365 License Not Activated',
    category: 'Email',
    status:   'assigned',
    priority: 'low',
    date:     daysAgo(2),
    deadline: hoursLater(36),
    assignee: CURRENT_ASSIGNEE,
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System', timestamp: daysAgo(2.2) },
      { action: 'Admin Approved',oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',     timestamp: daysAgo(2)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(1.5) },
    ],
    comments: [],
  },
  {
    ticketId: 'TD-001270',
    title:    'VPN Issue Recurring – London Office',
    category: 'Network',
    status:   'solving',
    priority: 'high',
    date:     daysAgo(1),
    deadline: hoursLater(6),
    assignee: CURRENT_ASSIGNEE,
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System', timestamp: daysAgo(1.5) },
      { action: 'Admin Approved',oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',     timestamp: daysAgo(1)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(0.9) },
      { action: 'Status Change', oldStatus: 'assigned', newStatus: 'solving',  by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(0.5) },
    ],
    comments: [
      { author: CURRENT_ASSIGNEE.name, type: 'internal', text: 'Reproduced the timeout. Checking VPN gateway logs.',              timestamp: daysAgo(0.5) },
      { author: CURRENT_ASSIGNEE.name, type: 'public',   text: 'Hi James, we have reproduced the issue and are actively working on it. Will update you shortly.', timestamp: daysAgo(0.3) },
    ],
  },
  {
    ticketId: 'TD-001248',
    title:    'Slow Query Performance on Reports Table',
    category: 'Database',
    status:   'solving',
    priority: 'medium',
    date:     daysAgo(5),
    deadline: hoursLater(3),      // nearly overdue — triggers urgency warning
    assignee: CURRENT_ASSIGNEE,
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System', timestamp: daysAgo(5.2) },
      { action: 'Admin Approved',oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',     timestamp: daysAgo(5)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(4.8) },
      { action: 'Status Change', oldStatus: 'assigned', newStatus: 'solving',  by: CURRENT_ASSIGNEE.name, timestamp: daysAgo(4)   },
    ],
    comments: [
      { author: 'Admin',               type: 'internal', text: 'EXPLAIN plan shows a full table scan on reports. Missing index.',       timestamp: daysAgo(4.5) },
      { author: CURRENT_ASSIGNEE.name, type: 'internal', text: 'Confirmed. Drafting migration script to add composite index.',          timestamp: daysAgo(4)   },
      { author: CURRENT_ASSIGNEE.name, type: 'public',   text: 'We have identified the performance bottleneck. Fix is being tested now.', timestamp: daysAgo(1)  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED TICKETS (last 30 days, current assignee only)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedTicket {
  ticketId:     string;
  title:        string;
  category:     string;
  status:       'solved' | 'failed';
  priority:     TicketPriority;
  date:         Date;
  resolvedDate: Date;
}

export const MY_RESOLVED_TICKETS: ResolvedTicket[] = DASHBOARD_TICKETS
  .filter(
    (t) =>
      t.assignee.name === CURRENT_ASSIGNEE.name &&
      (t.status === 'solved' || t.status === 'failed'),
  )
  .map((t) => ({
    ticketId:     t.ticketId,
    title:        t.title,
    category:     t.category,
    status:       t.status as 'solved' | 'failed',
    priority:     t.priority,
    date:         t.date,
    // approximate resolution time: firstResponseHours + resolutionHours after ticket date
    resolvedDate: new Date(
      t.date.getTime() +
        ((t.resolutionHours ?? t.firstResponseHours + 4) * 3_600_000),
    ),
  }));

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE SUMMARY
// Pre-computed so the page just reads values — no in-component derivation needed.
// ─────────────────────────────────────────────────────────────────────────────

const _thirtyDaysAgo = daysAgo(30);

export const ASSIGNEE_PERFORMANCE = {
  /** Tickets currently open and assigned to this user */
  activeCount: MY_ACTIVE_TICKETS.length,

  /** Total assigned (active + resolved) over all time in this dataset */
  totalAssigned:
    MY_ACTIVE_TICKETS.length + MY_RESOLVED_TICKETS.length,

  /** Solved in last 30 days */
  solvedLast30: MY_RESOLVED_TICKETS.filter(
    (t) => t.status === 'solved' && t.resolvedDate >= _thirtyDaysAgo,
  ).length,

  /** Failed in last 30 days */
  failedLast30: MY_RESOLVED_TICKETS.filter(
    (t) => t.status === 'failed' && t.resolvedDate >= _thirtyDaysAgo,
  ).length,

  /** Combined closed (solved + failed) in last 30 days */
  closedLast30: MY_RESOLVED_TICKETS.filter(
    (t) => t.resolvedDate >= _thirtyDaysAgo,
  ).length,

  /** Resolution rate (solved / total closed) as 0–100 integer */
  resolutionRatePct: (() => {
    const closed = MY_RESOLVED_TICKETS.filter((t) => t.resolvedDate >= _thirtyDaysAgo);
    if (closed.length === 0) return 0;
    const solved = closed.filter((t) => t.status === 'solved').length;
    return Math.round((solved / closed.length) * 100);
  })(),

  /** Average first-response time (hours) across all tickets */
  avgFirstResponseHours: (() => {
    const all = DASHBOARD_TICKETS.filter(
      (t) => t.assignee.name === CURRENT_ASSIGNEE.name && t.firstResponseHours > 0,
    );
    if (all.length === 0) return 0;
    const sum = all.reduce((acc, t) => acc + t.firstResponseHours, 0);
    return Math.round((sum / all.length) * 10) / 10;   // 1 decimal place
  })(),

  /** Critical tickets currently open */
  criticalCount: MY_ACTIVE_TICKETS.filter((t) => t.priority === 'critical').length,
};