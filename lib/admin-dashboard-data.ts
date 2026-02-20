// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus = "submitted" | "in-progress" | "resolved" | "critical";

export interface DashboardAssignee {
  name: string;
  avatar?: string;
  fallback: string;
  role: string;
  department: string;
}

export interface DashboardTicket {
  ticketId: string;
  title: string;
  category: string;
  date: Date;
  status: TicketStatus;
  assignee: DashboardAssignee;
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNEES
// ─────────────────────────────────────────────────────────────────────────────

export const DASHBOARD_ASSIGNEES: DashboardAssignee[] = [
  {
    name: "Palm Pollapat",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Palm",
    fallback: "PP",
    role: "Technical Support",
    department: "Database",
  },
  {
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    fallback: "JD",
    role: "IT Ops",
    department: "Network",
  },
  {
    name: "Sarah Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    fallback: "SS",
    role: "Security",
    department: "Compliance",
  },
  {
    name: "Mark Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
    fallback: "MC",
    role: "Network",
    department: "Infrastructure",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────────────────────────────────────

export const DASHBOARD_TICKETS: DashboardTicket[] = [
  {
    ticketId: "TD-001238",
    title: "VPN Connection Timeout – London Office",
    category: "Network",
    date: new Date(Date.now() - 2 * 60000),
    status: "submitted",
    assignee: DASHBOARD_ASSIGNEES[0],
  },
  {
    ticketId: "TD-001239",
    title: "Email Server Configuration Error",
    category: "Email",
    date: new Date(Date.now() - 15 * 60000),
    status: "submitted",
    assignee: DASHBOARD_ASSIGNEES[1],
  },
  {
    ticketId: "TD-001240",
    title: "Critical Security Vulnerability Detected",
    category: "Security",
    date: new Date(Date.now() - 5 * 60000),
    status: "submitted",
    assignee: DASHBOARD_ASSIGNEES[2],
  },
  {
    ticketId: "TD-001241",
    title: "Database Connection Pool Exhausted",
    category: "Database",
    date: new Date(Date.now() - 2 * 86400000),
    status: "in-progress",
    assignee: DASHBOARD_ASSIGNEES[0],
  },
  {
    ticketId: "TD-001242",
    title: "Application Performance Degradation",
    category: "Performance",
    date: new Date(Date.now() - 3 * 86400000),
    status: "in-progress",
    assignee: DASHBOARD_ASSIGNEES[1],
  },
  {
    ticketId: "TD-001243",
    title: "User Authentication Failed – SSO",
    category: "Authentication",
    date: new Date(Date.now() - 4 * 86400000),
    status: "in-progress",
    assignee: DASHBOARD_ASSIGNEES[3],
  },
  {
    ticketId: "TD-001244",
    title: "API Gateway Timeout Error",
    category: "Network",
    date: new Date(Date.now() - 9 * 86400000),
    status: "critical",
    assignee: DASHBOARD_ASSIGNEES[2],
  },
  {
    ticketId: "TD-001245",
    title: "File Upload Size Limit Exceeded",
    category: "Storage",
    date: new Date(Date.now() - 10 * 86400000),
    status: "resolved",
    assignee: DASHBOARD_ASSIGNEES[3],
  },
  {
    ticketId: "TD-001246",
    title: "Mobile App Crash on Startup",
    category: "Mobile",
    date: new Date(Date.now() - 16 * 86400000),
    status: "resolved",
    assignee: DASHBOARD_ASSIGNEES[0],
  },
  {
    ticketId: "TD-001247",
    title: "Firewall Rule Misconfiguration",
    category: "Security",
    date: new Date(Date.now() - 18 * 86400000),
    status: "resolved",
    assignee: DASHBOARD_ASSIGNEES[1],
  },
];