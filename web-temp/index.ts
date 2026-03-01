/**
 * web-temp/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all mock / placeholder data used during
 * development. Every hardcoded fake dataset in the frontend originates here.
 *
 * In production these constants are replaced by real API responses — nothing
 * in this file should be imported by backend or infrastructure code.
 *
 * Import map:
 *   lib/admin-dashboard-data.ts   → re-exports from here + UI config
 *   lib/assignee-dashboard-data.ts → imports from here + computes derived data
 *   lib/constants.ts               → re-exports legacy aliases from here
 *   components/tickets/TicketTable → imports MOCK_TABLE_TICKETS from here
 *   app/admin/settings             → imports SCOPE_NAMES from here
 *   app/admin/user-management      → imports SCOPE_NAMES from here
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'draft'     // AI generated, waiting for Admin review
  | 'new'       // Admin confirmed, Assignee notified
  | 'assigned'  // Assignee acknowledged
  | 'solving'   // Assignee actively working
  | 'solved'    // Successfully resolved
  | 'failed'    // Could not be resolved
  | 'renew';    // Reopened after solved/failed

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type UserRole       = 'admin' | 'assignee' | 'user';
export type UserStatus     = 'active' | 'suspended';
export type CommentType    = 'internal' | 'public';

export interface DashboardAssignee {
  name:       string;
  avatar?:    string;
  fallback:   string;
  role:       string;
  department: string;
}

export interface DashboardTicket {
  ticketId:             string;
  title:                string;
  category:             string;
  date:                 Date;
  status:               TicketStatus;
  assignee:             DashboardAssignee;
  priority:             TicketPriority;
  firstResponseHours:   number;
  resolutionHours?:     number;
  slaBreached:          boolean;
  aiProcessingSeconds:  number;
  aiSuggestionAccepted: boolean;
  aiCategoryMatch:      boolean;
}

export interface AISuggestion {
  summary:          string;
  suggestedSolution: string;
  category:         string;
  deadline:         string;
  deadlineTime:     string;
}

export interface OriginalMessage {
  from: string;
  body: string;
}

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
  assigneeIndex?: number;
}

export interface TicketComment {
  author:    string;
  type:      CommentType;
  text:      string;
  timestamp: Date;
}

export interface TicketHistoryEntry {
  action:    string;
  oldStatus: TicketStatus | null;
  newStatus: TicketStatus;
  by:        string;
  detail?:   string;
  timestamp: Date;
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
  comments:  TicketComment[];
}

export interface ResolvedTicket {
  ticketId:     string;
  title:        string;
  category:     string;
  status:       'solved' | 'failed';
  priority:     TicketPriority;
  date:         Date;
  resolvedDate: Date;
}

/** Shape used by TicketTable component */
export interface MockTableTicket {
  ticketId: string;
  title:    string;
  category: string | null;
  date:     Date;
  status:   'submitted' | 'in-progress' | 'resolved' | 'critical';
  assignee?: { name: string; avatar?: string; fallback: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS  (date arithmetic for relative timestamps)
// ─────────────────────────────────────────────────────────────────────────────

const _now        = Date.now();
const daysAgo    = (d: number) => new Date(_now - d * 86_400_000);
const minsAgo    = (m: number) => new Date(_now - m * 60_000);
const hoursLater = (h: number) => new Date(_now + h * 3_600_000);

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ASSIGNEES
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ASSIGNEES: DashboardAssignee[] = [
  { name: 'Palm Pollapat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Palm',  fallback: 'PP', role: 'Technical Support', department: 'Database'       },
  { name: 'John Doe',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',  fallback: 'JD', role: 'IT Ops',            department: 'Network'        },
  { name: 'Sarah Smith',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', fallback: 'SS', role: 'Security',          department: 'Compliance'     },
  { name: 'Mark Chen',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',  fallback: 'MC', role: 'Network',           department: 'Infrastructure' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TICKETS  (32 entries spanning all statuses)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TICKETS: DashboardTicket[] = [
  // draft
  { ticketId: 'TD-001238', title: 'VPN Connection Timeout – London Office',        category: 'Network',        date: minsAgo(2),        status: 'draft',    assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 8,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001239', title: 'Email Server Configuration Error',              category: 'Email',          date: minsAgo(15),       status: 'draft',    assignee: MOCK_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 12, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001240', title: 'Critical Security Vulnerability Detected',      category: 'Security',       date: minsAgo(5),        status: 'draft',    assignee: MOCK_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 6,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001264', title: 'Printer Offline – Floor 3',                    category: 'Facilities',     date: minsAgo(30),       status: 'draft',    assignee: MOCK_ASSIGNEES[3], priority: 'low',      firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 10, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001265', title: 'Cannot Access HR Portal After Password Reset',  category: 'Authentication', date: minsAgo(45),       status: 'draft',    assignee: MOCK_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 14, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  // new
  { ticketId: 'TD-001241', title: 'Database Connection Pool Exhausted',            category: 'Database',       date: daysAgo(2),        status: 'new',      assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 1.0, slaBreached: false, aiProcessingSeconds: 14, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001266', title: 'Shared Drive Permissions Revoked',              category: 'Storage',        date: daysAgo(1),        status: 'new',      assignee: MOCK_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  // assigned
  { ticketId: 'TD-001242', title: 'Application Performance Degradation',           category: 'Performance',    date: daysAgo(3),        status: 'assigned', assignee: MOCK_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 2.5, slaBreached: false, aiProcessingSeconds: 22, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001267', title: 'Office 365 License Not Activated',              category: 'Email',          date: daysAgo(2),        status: 'assigned', assignee: MOCK_ASSIGNEES[0], priority: 'low',      firstResponseHours: 3.0, slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  // solving
  { ticketId: 'TD-001243', title: 'User Authentication Failed – SSO',              category: 'Authentication', date: daysAgo(4),        status: 'solving',  assignee: MOCK_ASSIGNEES[3], priority: 'high',     firstResponseHours: 1.8, slaBreached: true,  aiProcessingSeconds: 19, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001244', title: 'API Gateway Timeout Error',                     category: 'Network',        date: daysAgo(9),        status: 'solving',  assignee: MOCK_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0.3, slaBreached: true,  aiProcessingSeconds: 34, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001268', title: 'Slow Internet Speed – Marketing Floor',         category: 'Network',        date: daysAgo(5),        status: 'solving',  assignee: MOCK_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 2.0, slaBreached: false, aiProcessingSeconds: 16, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  // solved
  { ticketId: 'TD-001245', title: 'File Upload Size Limit Exceeded',               category: 'Storage',        date: daysAgo(10),       status: 'solved',   assignee: MOCK_ASSIGNEES[3], priority: 'low',      firstResponseHours: 3.5, resolutionHours: 18.0, slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001246', title: 'Mobile App Crash on Startup',                   category: 'Mobile',         date: daysAgo(16),       status: 'solved',   assignee: MOCK_ASSIGNEES[0], priority: 'medium',   firstResponseHours: 2.0, resolutionHours: 8.5,  slaBreached: false, aiProcessingSeconds: 17, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001247', title: 'Firewall Rule Misconfiguration',                category: 'Security',       date: daysAgo(18),       status: 'solved',   assignee: MOCK_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.5, resolutionHours: 5.5,  slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001248', title: 'Slow Query Performance on Reports Table',       category: 'Database',       date: daysAgo(5),        status: 'solved',   assignee: MOCK_ASSIGNEES[0], priority: 'medium',   firstResponseHours: 1.2, resolutionHours: 6.0,  slaBreached: false, aiProcessingSeconds: 15, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001249', title: 'SSL Certificate Expiry Warning',                category: 'Security',       date: daysAgo(6),        status: 'solved',   assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.8, resolutionHours: 3.5,  slaBreached: false, aiProcessingSeconds: 7,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001250', title: 'Disk Space Alert – Production Server',          category: 'Storage',        date: daysAgo(7),        status: 'solved',   assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.6, resolutionHours: 4.0,  slaBreached: false, aiProcessingSeconds: 10, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001251', title: 'Network Switch Port Failure',                   category: 'Network',        date: daysAgo(8),        status: 'solved',   assignee: MOCK_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.1, resolutionHours: 7.0,  slaBreached: false, aiProcessingSeconds: 13, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001252', title: 'DNS Resolution Failure – Internal Services',    category: 'Network',        date: daysAgo(11),       status: 'solved',   assignee: MOCK_ASSIGNEES[1], priority: 'critical', firstResponseHours: 0.4, resolutionHours: 2.5,  slaBreached: false, aiProcessingSeconds: 5,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001253', title: 'Load Balancer Health Check Failing',            category: 'Network',        date: daysAgo(12),       status: 'solved',   assignee: MOCK_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 1.8, resolutionHours: 9.0,  slaBreached: false, aiProcessingSeconds: 20, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001254', title: 'Ransomware Attempt Blocked – Endpoint',         category: 'Security',       date: daysAgo(13),       status: 'solved',   assignee: MOCK_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0.2, resolutionHours: 3.0,  slaBreached: false, aiProcessingSeconds: 4,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001255', title: 'Phishing Email Campaign Detected',              category: 'Security',       date: daysAgo(14),       status: 'solved',   assignee: MOCK_ASSIGNEES[2], priority: 'high',     firstResponseHours: 0.5, resolutionHours: 5.0,  slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001257', title: 'Kubernetes Pod Crash – Payments Service',       category: 'Performance',    date: daysAgo(17),       status: 'solved',   assignee: MOCK_ASSIGNEES[3], priority: 'critical', firstResponseHours: 0.3, resolutionHours: 4.5,  slaBreached: false, aiProcessingSeconds: 18, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001258', title: 'Backup Job Failing – Nightly Schedule',         category: 'Storage',        date: daysAgo(19),       status: 'solved',   assignee: MOCK_ASSIGNEES[3], priority: 'high',     firstResponseHours: 2.0, resolutionHours: 12.0, slaBreached: false, aiProcessingSeconds: 21, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001259', title: 'CI/CD Pipeline Build Timeout',                  category: 'Performance',    date: daysAgo(20),       status: 'solved',   assignee: MOCK_ASSIGNEES[3], priority: 'medium',   firstResponseHours: 2.5, resolutionHours: 10.0, slaBreached: false, aiProcessingSeconds: 27, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001260', title: 'Memory Leak in Reporting Microservice',         category: 'Performance',    date: daysAgo(21),       status: 'solved',   assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 1.3, resolutionHours: 7.5,  slaBreached: false, aiProcessingSeconds: 28, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001262', title: 'SIEM Alert – Unusual Login Pattern',            category: 'Security',       date: daysAgo(23),       status: 'solved',   assignee: MOCK_ASSIGNEES[2], priority: 'high',     firstResponseHours: 0.7, resolutionHours: 4.0,  slaBreached: false, aiProcessingSeconds: 16, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001263', title: 'Container Registry Out of Space',               category: 'Storage',        date: daysAgo(24),       status: 'solved',   assignee: MOCK_ASSIGNEES[3], priority: 'medium',   firstResponseHours: 2.2, resolutionHours: 11.0, slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  // failed
  { ticketId: 'TD-001256', title: 'Two-Factor Auth Not Sending SMS',               category: 'Authentication', date: daysAgo(15),       status: 'failed',   assignee: MOCK_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 1.0, resolutionHours: 6.5,  slaBreached: true,  aiProcessingSeconds: 24, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001261', title: 'Active Directory Sync Failure',                 category: 'Authentication', date: daysAgo(22),       status: 'failed',   assignee: MOCK_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.6, resolutionHours: 8.0,  slaBreached: true,  aiProcessingSeconds: 38, aiSuggestionAccepted: false, aiCategoryMatch: false },
  { ticketId: 'TD-001269', title: 'Legacy System Migration Rollback',              category: 'Performance',    date: daysAgo(25),       status: 'failed',   assignee: MOCK_ASSIGNEES[3], priority: 'critical', firstResponseHours: 0.5, resolutionHours: 20.0, slaBreached: true,  aiProcessingSeconds: 32, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  // renew
  { ticketId: 'TD-001270', title: 'VPN Issue Recurring – London Office',           category: 'Network',        date: daysAgo(1),        status: 'renew',    assignee: MOCK_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.5, slaBreached: false, aiProcessingSeconds: 8,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001271', title: 'Two-Factor Auth Still Failing After Fix',       category: 'Authentication', date: daysAgo(2),        status: 'renew',    assignee: MOCK_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 1.0, slaBreached: false, aiProcessingSeconds: 12, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK AI SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_AI_SUGGESTIONS: Record<string, AISuggestion> = {
  'TD-001238': { summary: 'User reports VPN connection timeouts after ~2 minutes, preventing access to internal resources. Issue persists after reinstalling VPN client. Work is blocked due to an important deadline.', suggestedSolution: '1. Check VPN server load and session limits\n2. Review VPN client logs for timeout error codes\n3. Verify firewall rules allow persistent VPN sessions\n4. Test alternate VPN gateway endpoints', category: 'Network / VPN', deadline: '2026-02-26', deadlineTime: '17:00' },
  'TD-001239': { summary: 'Email server misconfiguration is causing delivery failures across the organisation. Multiple users affected. SMTP relay settings appear to be the root cause.', suggestedSolution: '1. Audit current SMTP relay configuration\n2. Compare with last known-good config snapshot\n3. Restart mail transfer agent service\n4. Test with internal and external addresses', category: 'Email / SMTP', deadline: '2026-02-25', deadlineTime: '12:00' },
  'TD-001240': { summary: 'A critical security vulnerability has been detected in the production environment. Immediate triage and patching are required to prevent potential data breach.', suggestedSolution: '1. Isolate affected systems immediately\n2. Identify CVE and patch version\n3. Apply emergency patch in staging first\n4. Deploy fix to production and validate', category: 'Security / Vulnerability', deadline: '2026-02-24', deadlineTime: '23:59' },
  'TD-001241': { summary: 'Database connection pool has been exhausted, causing application-level errors. Peak query load is suspected. Connection leak or misconfigured pool size may be involved.', suggestedSolution: '1. Increase connection pool max size temporarily\n2. Identify long-running or leaked connections\n3. Optimise slow queries contributing to pool pressure\n4. Schedule pool tuning during maintenance window', category: 'Database / Performance', deadline: '2026-02-27', deadlineTime: '09:00' },
  'TD-001264': { summary: 'Printer on Floor 3 is showing offline status. Users unable to print. Issue may be related to network connectivity or driver configuration.', suggestedSolution: '1. Check printer network connection and IP assignment\n2. Restart printer spooler service on affected machines\n3. Reinstall printer driver if issue persists\n4. Test with direct USB connection to isolate network vs hardware', category: 'Facilities / Hardware', deadline: '2026-02-28', deadlineTime: '12:00' },
  'TD-001265': { summary: 'User cannot access HR portal after completing a password reset. Authentication appears to succeed but portal redirects to login page repeatedly.', suggestedSolution: '1. Clear browser cache and cookies\n2. Verify password propagation across SSO systems\n3. Check HR portal session token configuration\n4. Manually re-sync user credentials in identity provider', category: 'Authentication / HR', deadline: '2026-02-28', deadlineTime: '17:00' },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ORIGINAL MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ORIGINAL_MESSAGES: Record<string, OriginalMessage> = {
  'TD-001238': { from: 'James Harrington', body: "Hi Support Team,\n\nI'm experiencing issues connecting to the company VPN. The connection keeps timing out after about 2 minutes, and I'm unable to access internal resources. I've tried restarting my computer and reinstalling the VPN client, but the problem persists.\n\nThis is blocking my work as I need to access the file server for an important project deadline today.\n\nCould you please help me resolve this urgently?\n\nThanks,\nJames" },
  'TD-001239': { from: 'Laura Benson',     body: "Hi Support,\n\nSince this morning our email service seems to be misconfigured. Outgoing messages to external recipients are bouncing back. Our SMTP relay might be the culprit.\n\nSeveral colleagues are affected and we have time-sensitive client communications pending.\n\nPlease assist as soon as possible.\n\nBest,\nLaura" },
  'TD-001240': { from: 'Security Scanner', body: "AUTOMATED ALERT — CRITICAL\n\nA high-severity vulnerability has been detected in the production environment:\n\n  CVE ID: CVE-2025-XXXX\n  Severity: CRITICAL (CVSS 9.8)\n  Component: Authentication middleware\n  Affected hosts: prod-api-01, prod-api-02\n\nImmediate remediation is required. Please escalate to the security team.\n\n— Automated Security Platform" },
  'TD-001241': { from: 'AppMonitor',       body: "Hi DBA Team,\n\nOur monitoring system has flagged that the database connection pool is now at 100% utilisation. Application errors related to connection acquisition timeouts are appearing in the logs.\n\nThis is causing failures for end-users across multiple services.\n\nKindly investigate and resolve.\n\nRegards,\nApp Monitoring Bot" },
  'TD-001264': { from: 'Mike Torres',      body: "Hi IT,\n\nThe printer on Floor 3 (near the kitchen) has been showing as offline since yesterday afternoon. Multiple colleagues have tried printing and nothing is coming out.\n\nCould someone come take a look?\n\nThanks,\nMike" },
  'TD-001265': { from: 'Priya Nair',       body: "Hello,\n\nI reset my password yesterday as prompted, but now I can't log into the HR portal. It shows the login page, I enter my new credentials, and it just reloads back to the login screen.\n\nI need to submit my timesheet by end of day.\n\nPlease help!\n\nPriya" },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK MANAGED USERS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_MANAGED_USERS: ManagedUser[] = [
  // Admin
  { id: 'admin-0',    name: 'Palm Pollapat',    email: 'palm.pollapat@ceivo.io',   fallback: 'PP', role: 'admin',    status: 'active',    scopes: ['Database'],                                    joinedAt: new Date('2024-01-10'), ticketCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Palm Pollapat').length,  resolvedCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Palm Pollapat' && t.status === 'solved').length,  lastActive: minsAgo(5),           assigneeIndex: 0 },
  // Assignees
  { id: 'assignee-1', name: 'John Doe',         email: 'john.doe@ceivo.io',        fallback: 'JD', role: 'assignee', status: 'active',    scopes: ['Network', 'IT Ops'],                           joinedAt: new Date('2024-02-14'), ticketCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'John Doe').length,      resolvedCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'John Doe' && t.status === 'solved').length,      lastActive: new Date(_now - 2 * 3600000), assigneeIndex: 1 },
  { id: 'assignee-2', name: 'Sarah Smith',      email: 'sarah.smith@ceivo.io',     fallback: 'SS', role: 'assignee', status: 'active',    scopes: ['Security', 'Authentication', 'Compliance'],    joinedAt: new Date('2024-02-20'), ticketCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Sarah Smith').length,   resolvedCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Sarah Smith' && t.status === 'solved').length,   lastActive: new Date(_now - 1 * 3600000), assigneeIndex: 2 },
  { id: 'assignee-3', name: 'Mark Chen',        email: 'mark.chen@ceivo.io',       fallback: 'MC', role: 'assignee', status: 'active',    scopes: ['Network', 'Infrastructure', 'Storage'],        joinedAt: new Date('2024-03-05'), ticketCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Mark Chen').length,     resolvedCount: MOCK_TICKETS.filter((t) => t.assignee.name === 'Mark Chen' && t.status === 'solved').length,     lastActive: new Date(_now - 30 * 60000),  assigneeIndex: 3 },
  // End-users
  { id: 'user-0',     name: 'James Harrington', email: 'james.h@gmail.com',        fallback: 'JH', role: 'user',     status: 'active',    scopes: [], joinedAt: new Date('2024-05-12'), ticketCount: 1, resolvedCount: 0, lastActive: daysAgo(3)  },
  { id: 'user-1',     name: 'Laura Benson',     email: 'laura.b@gmail.com',        fallback: 'LB', role: 'user',     status: 'active',    scopes: [], joinedAt: new Date('2024-06-01'), ticketCount: 1, resolvedCount: 0, lastActive: daysAgo(7)  },
  { id: 'user-2',     name: 'Priya Nair',       email: 'priya.nair@gmail.com',     fallback: 'PN', role: 'user',     status: 'active',    scopes: [], joinedAt: new Date('2024-06-18'), ticketCount: 2, resolvedCount: 0, lastActive: daysAgo(1)  },
  { id: 'user-3',     name: 'Mike Torres',      email: 'mike.t@gmail.com',         fallback: 'MT', role: 'user',     status: 'suspended', scopes: [], joinedAt: new Date('2024-07-04'), ticketCount: 1, resolvedCount: 0, lastActive: daysAgo(14) },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ACTIVE TICKETS  (assignee view — Palm Pollapat)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ACTIVE_TICKETS: AssigneeTicket[] = [
  {
    ticketId: 'TD-001241', title: 'Database Connection Pool Exhausted', category: 'Database',
    status: 'assigned', priority: 'high', date: daysAgo(2), deadline: hoursLater(18),
    assignee: MOCK_ASSIGNEES[0], creator: 'James Carter', followers: [MOCK_ASSIGNEES[1], MOCK_ASSIGNEES[2]],
    history: [
      { action: 'Created',        oldStatus: null,       newStatus: 'draft',    by: 'AI System',           timestamp: daysAgo(2.1) },
      { action: 'Admin Approved', oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',               timestamp: daysAgo(2)   },
      { action: 'Acknowledged',   oldStatus: 'new',      newStatus: 'assigned', by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(1.8) },
    ],
    comments: [
      { author: 'Admin',                  type: 'internal', text: 'Peak load suspected. Please check connection leak first.', timestamp: daysAgo(1.9) },
      { author: MOCK_ASSIGNEES[0].name,   type: 'internal', text: 'Acknowledged. Will run a connection audit now.',           timestamp: daysAgo(1.8) },
    ],
  },
  {
    ticketId: 'TD-001267', title: 'Office 365 License Not Activated', category: 'Email',
    status: 'assigned', priority: 'low', date: daysAgo(2), deadline: hoursLater(36),
    assignee: MOCK_ASSIGNEES[0], creator: 'Sarah Mitchell', followers: [],
    history: [
      { action: 'Created',        oldStatus: null,       newStatus: 'draft',    by: 'AI System',           timestamp: daysAgo(2.2) },
      { action: 'Admin Approved', oldStatus: 'draft',    newStatus: 'new',      by: 'Admin',               timestamp: daysAgo(2)   },
      { action: 'Acknowledged',   oldStatus: 'new',      newStatus: 'assigned', by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(1.5) },
    ],
    comments: [],
  },
  {
    ticketId: 'TD-001270', title: 'VPN Issue Recurring – London Office', category: 'Network',
    status: 'solving', priority: 'high', date: daysAgo(1), deadline: hoursLater(6),
    assignee: MOCK_ASSIGNEES[0], creator: 'James Carter', followers: [MOCK_ASSIGNEES[3]],
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System',           timestamp: daysAgo(1.5) },
      { action: 'Admin Approved', oldStatus: 'draft',   newStatus: 'new',      by: 'Admin',               timestamp: daysAgo(1)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(0.9) },
      { action: 'Status Change', oldStatus: 'assigned', newStatus: 'solving',  by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(0.5) },
    ],
    comments: [
      { author: MOCK_ASSIGNEES[0].name, type: 'internal', text: 'Reproduced the timeout. Checking VPN gateway logs.',                                             timestamp: daysAgo(0.5) },
      { author: MOCK_ASSIGNEES[0].name, type: 'public',   text: 'Hi James, we have reproduced the issue and are actively working on it. Will update you shortly.', timestamp: daysAgo(0.3) },
    ],
  },
  {
    ticketId: 'TD-001248', title: 'Slow Query Performance on Reports Table', category: 'Database',
    status: 'solving', priority: 'medium', date: daysAgo(5), deadline: hoursLater(3),
    assignee: MOCK_ASSIGNEES[0], creator: 'AI System', followers: [MOCK_ASSIGNEES[1]],
    history: [
      { action: 'Created',       oldStatus: null,       newStatus: 'draft',    by: 'AI System',           timestamp: daysAgo(5.2) },
      { action: 'Admin Approved', oldStatus: 'draft',   newStatus: 'new',      by: 'Admin',               timestamp: daysAgo(5)   },
      { action: 'Acknowledged',  oldStatus: 'new',      newStatus: 'assigned', by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(4.8) },
      { action: 'Status Change', oldStatus: 'assigned', newStatus: 'solving',  by: MOCK_ASSIGNEES[0].name, timestamp: daysAgo(4)   },
    ],
    comments: [
      { author: 'Admin',                type: 'internal', text: 'EXPLAIN plan shows a full table scan on reports. Missing index.',        timestamp: daysAgo(4.5) },
      { author: MOCK_ASSIGNEES[0].name, type: 'internal', text: 'Confirmed. Drafting migration script to add composite index.',           timestamp: daysAgo(4)   },
      { author: MOCK_ASSIGNEES[0].name, type: 'public',   text: 'We have identified the performance bottleneck. Fix is being tested now.', timestamp: daysAgo(1)   },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE NAMES  (shared by settings page and user-management page)
// ─────────────────────────────────────────────────────────────────────────────

export const SCOPE_NAMES: string[] = [
  'Network', 'Security', 'Database', 'Email', 'Performance',
  'Authentication', 'Storage', 'Mobile', 'Facilities',
  'HR', 'Finance', 'IT Ops', 'Compliance', 'Infrastructure',
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TABLE TICKETS  (fallback for TicketTable when no real data is passed)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TABLE_TICKETS: MockTableTicket[] = [
  { ticketId: 'TD-001238', title: 'VPN Connection Timeout',          category: 'Network',        date: new Date('2025-01-30T08:15:00'), status: 'submitted',  assignee: { name: 'shadcn',        fallback: 'SC' } },
  { ticketId: 'TD-001239', title: 'Email Server Configuration',      category: 'Email',          date: new Date('2025-01-29T14:30:00'), status: 'in-progress', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-001240', title: 'Database Connection Pool Issue',   category: 'Database',       date: new Date('2025-01-28T10:45:00'), status: 'resolved',   assignee: { name: 'John Doe',      fallback: 'JD' } },
  { ticketId: 'TD-001241', title: 'Critical Security Vulnerability',  category: 'Security',       date: new Date('2025-01-27T16:20:00'), status: 'critical',   assignee: { name: 'Sarah Smith',   fallback: 'SS' } },
  { ticketId: 'TD-001242', title: 'Application Performance Slow',     category: 'Performance',    date: new Date('2025-01-26T09:00:00'), status: 'in-progress', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-001243', title: 'User Authentication Failed',       category: 'Authentication', date: new Date('2025-01-25T11:30:00'), status: 'submitted',  assignee: { name: 'shadcn',        fallback: 'SC' } },
  { ticketId: 'TD-001244', title: 'API Gateway Timeout Error',        category: 'Network',        date: new Date('2025-01-24T15:45:00'), status: 'critical',   assignee: { name: 'John Doe',      fallback: 'JD' } },
  { ticketId: 'TD-001245', title: 'File Upload Size Limit Issue',     category: 'Storage',        date: new Date('2025-01-23T13:20:00'), status: 'in-progress', assignee: { name: 'Sarah Smith',   fallback: 'SS' } },
  { ticketId: 'TD-001246', title: 'Mobile App Crash on Startup',      category: 'Mobile',         date: new Date('2025-01-22T08:00:00'), status: 'submitted',  assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ALIASES  (used by lib/constants.ts — kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export const LEGACY_MOCK_USERS = [
  { name: 'shadcn',        avatar: 'https://github.com/shadcn.png',                              fallback: 'SC' },
  { name: 'Palm Pollapat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Palm',       fallback: 'PP' },
  { name: 'John Doe',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',       fallback: 'JD' },
  { name: 'Sarah Smith',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',      fallback: 'SS' },
];

export const LEGACY_MOCK_TICKETS = MOCK_TABLE_TICKETS; // same shape, reuse
