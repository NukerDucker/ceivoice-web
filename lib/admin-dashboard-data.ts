// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'draft'        // AI generated, waiting for Admin review
  | 'new'          // Admin confirmed, Assignee notified
  | 'assigned'     // Assignee acknowledged
  | 'solving'      // Assignee actively working
  | 'solved'       // Successfully resolved
  | 'failed'       // Could not be resolved
  | 'renew';       // Reopened after solved/failed

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

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
  // ── Performance fields ────────────────────────────────────────────────────
  priority: TicketPriority;
  firstResponseHours: number;
  resolutionHours?: number;
  slaBreached: boolean;
  // ── AI Accuracy fields ────────────────────────────────────────────────────
  aiProcessingSeconds: number;
  aiSuggestionAccepted: boolean;
  aiCategoryMatch: boolean;
}

export interface AISuggestion {
  summary: string;
  suggestedSolution: string;
  category: string;
  deadline: string;
  deadlineTime: string;
}

export interface OriginalMessage {
  from: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNEES
// ─────────────────────────────────────────────────────────────────────────────

export const DASHBOARD_ASSIGNEES: DashboardAssignee[] = [
  { name: 'Palm Pollapat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Palm',  fallback: 'PP', role: 'Technical Support', department: 'Database'       },
  { name: 'John Doe',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',  fallback: 'JD', role: 'IT Ops',            department: 'Network'        },
  { name: 'Sarah Smith',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', fallback: 'SS', role: 'Security',          department: 'Compliance'     },
  { name: 'Mark Chen',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',  fallback: 'MC', role: 'Network',           department: 'Infrastructure' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────────────────────────────────────

export const DASHBOARD_TICKETS: DashboardTicket[] = [

  // ── draft — AI generated, waiting for Admin review ────────────────────────
  { ticketId: 'TD-001238', title: 'VPN Connection Timeout – London Office',        category: 'Network',        date: new Date(Date.now() -  2 * 60000),    status: 'draft',    assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 8,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001239', title: 'Email Server Configuration Error',              category: 'Email',          date: new Date(Date.now() - 15 * 60000),    status: 'draft',    assignee: DASHBOARD_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 12, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001240', title: 'Critical Security Vulnerability Detected',      category: 'Security',       date: new Date(Date.now() -  5 * 60000),    status: 'draft',    assignee: DASHBOARD_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 6,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001264', title: 'Printer Offline – Floor 3',                    category: 'Facilities',     date: new Date(Date.now() - 30 * 60000),    status: 'draft',    assignee: DASHBOARD_ASSIGNEES[3], priority: 'low',      firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 10, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001265', title: 'Cannot Access HR Portal After Password Reset',  category: 'Authentication', date: new Date(Date.now() - 45 * 60000),    status: 'draft',    assignee: DASHBOARD_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 14, aiSuggestionAccepted: true,  aiCategoryMatch: true  },

  // ── new — Admin confirmed, Assignee notified ──────────────────────────────
  { ticketId: 'TD-001241', title: 'Database Connection Pool Exhausted',            category: 'Database',       date: new Date(Date.now() -  2 * 86400000), status: 'new',      assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 1.0, slaBreached: false, aiProcessingSeconds: 14, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001266', title: 'Shared Drive Permissions Revoked',              category: 'Storage',        date: new Date(Date.now() -  1 * 86400000), status: 'new',      assignee: DASHBOARD_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 0,   slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: true,  aiCategoryMatch: true  },

  // ── assigned — Assignee acknowledged ─────────────────────────────────────
  { ticketId: 'TD-001242', title: 'Application Performance Degradation',           category: 'Performance',    date: new Date(Date.now() -  3 * 86400000), status: 'assigned', assignee: DASHBOARD_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 2.5, slaBreached: false, aiProcessingSeconds: 22, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001267', title: 'Office 365 License Not Activated',              category: 'Email',          date: new Date(Date.now() -  2 * 86400000), status: 'assigned', assignee: DASHBOARD_ASSIGNEES[0], priority: 'low',      firstResponseHours: 3.0, slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },

  // ── solving — Assignee actively working ──────────────────────────────────
  { ticketId: 'TD-001243', title: 'User Authentication Failed – SSO',              category: 'Authentication', date: new Date(Date.now() -  4 * 86400000), status: 'solving',  assignee: DASHBOARD_ASSIGNEES[3], priority: 'high',     firstResponseHours: 1.8, slaBreached: true,  aiProcessingSeconds: 19, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001244', title: 'API Gateway Timeout Error',                     category: 'Network',        date: new Date(Date.now() -  9 * 86400000), status: 'solving',  assignee: DASHBOARD_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0.3, slaBreached: true,  aiProcessingSeconds: 34, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001268', title: 'Slow Internet Speed – Marketing Floor',         category: 'Network',        date: new Date(Date.now() -  5 * 86400000), status: 'solving',  assignee: DASHBOARD_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 2.0, slaBreached: false, aiProcessingSeconds: 16, aiSuggestionAccepted: true,  aiCategoryMatch: true  },

  // ── solved — successfully resolved ───────────────────────────────────────
  { ticketId: 'TD-001245', title: 'File Upload Size Limit Exceeded',               category: 'Storage',        date: new Date(Date.now() - 10 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'low',      firstResponseHours: 3.5, resolutionHours: 18.0, slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001246', title: 'Mobile App Crash on Startup',                   category: 'Mobile',         date: new Date(Date.now() - 16 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[0], priority: 'medium',   firstResponseHours: 2.0, resolutionHours: 8.5,  slaBreached: false, aiProcessingSeconds: 17, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001247', title: 'Firewall Rule Misconfiguration',                category: 'Security',       date: new Date(Date.now() - 18 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.5, resolutionHours: 5.5,  slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001248', title: 'Slow Query Performance on Reports Table',       category: 'Database',       date: new Date(Date.now() -  5 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[0], priority: 'medium',   firstResponseHours: 1.2, resolutionHours: 6.0,  slaBreached: false, aiProcessingSeconds: 15, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001249', title: 'SSL Certificate Expiry Warning',                category: 'Security',       date: new Date(Date.now() -  6 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.8, resolutionHours: 3.5,  slaBreached: false, aiProcessingSeconds: 7,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001250', title: 'Disk Space Alert – Production Server',          category: 'Storage',        date: new Date(Date.now() -  7 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.6, resolutionHours: 4.0,  slaBreached: false, aiProcessingSeconds: 10, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001251', title: 'Network Switch Port Failure',                   category: 'Network',        date: new Date(Date.now() -  8 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.1, resolutionHours: 7.0,  slaBreached: false, aiProcessingSeconds: 13, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001252', title: 'DNS Resolution Failure – Internal Services',    category: 'Network',        date: new Date(Date.now() - 11 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[1], priority: 'critical', firstResponseHours: 0.4, resolutionHours: 2.5,  slaBreached: false, aiProcessingSeconds: 5,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001253', title: 'Load Balancer Health Check Failing',            category: 'Network',        date: new Date(Date.now() - 12 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[1], priority: 'medium',   firstResponseHours: 1.8, resolutionHours: 9.0,  slaBreached: false, aiProcessingSeconds: 20, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001254', title: 'Ransomware Attempt Blocked – Endpoint',         category: 'Security',       date: new Date(Date.now() - 13 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[2], priority: 'critical', firstResponseHours: 0.2, resolutionHours: 3.0,  slaBreached: false, aiProcessingSeconds: 4,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001255', title: 'Phishing Email Campaign Detected',              category: 'Security',       date: new Date(Date.now() - 14 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[2], priority: 'high',     firstResponseHours: 0.5, resolutionHours: 5.0,  slaBreached: false, aiProcessingSeconds: 9,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001257', title: 'Kubernetes Pod Crash – Payments Service',       category: 'Performance',    date: new Date(Date.now() - 17 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'critical', firstResponseHours: 0.3, resolutionHours: 4.5,  slaBreached: false, aiProcessingSeconds: 18, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001258', title: 'Backup Job Failing – Nightly Schedule',         category: 'Storage',        date: new Date(Date.now() - 19 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'high',     firstResponseHours: 2.0, resolutionHours: 12.0, slaBreached: false, aiProcessingSeconds: 21, aiSuggestionAccepted: false, aiCategoryMatch: true  },
  { ticketId: 'TD-001259', title: 'CI/CD Pipeline Build Timeout',                  category: 'Performance',    date: new Date(Date.now() - 20 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'medium',   firstResponseHours: 2.5, resolutionHours: 10.0, slaBreached: false, aiProcessingSeconds: 27, aiSuggestionAccepted: true,  aiCategoryMatch: false },
  { ticketId: 'TD-001260', title: 'Memory Leak in Reporting Microservice',         category: 'Performance',    date: new Date(Date.now() - 21 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 1.3, resolutionHours: 7.5,  slaBreached: false, aiProcessingSeconds: 28, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001262', title: 'SIEM Alert – Unusual Login Pattern',            category: 'Security',       date: new Date(Date.now() - 23 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[2], priority: 'high',     firstResponseHours: 0.7, resolutionHours: 4.0,  slaBreached: false, aiProcessingSeconds: 16, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001263', title: 'Container Registry Out of Space',               category: 'Storage',        date: new Date(Date.now() - 24 * 86400000), status: 'solved',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'medium',   firstResponseHours: 2.2, resolutionHours: 11.0, slaBreached: false, aiProcessingSeconds: 11, aiSuggestionAccepted: true,  aiCategoryMatch: true  },

  // ── failed — could not be resolved ───────────────────────────────────────
  { ticketId: 'TD-001256', title: 'Two-Factor Auth Not Sending SMS',               category: 'Authentication', date: new Date(Date.now() - 15 * 86400000), status: 'failed',   assignee: DASHBOARD_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 1.0, resolutionHours: 6.5,  slaBreached: true,  aiProcessingSeconds: 24, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001261', title: 'Active Directory Sync Failure',                 category: 'Authentication', date: new Date(Date.now() - 22 * 86400000), status: 'failed',   assignee: DASHBOARD_ASSIGNEES[1], priority: 'high',     firstResponseHours: 1.6, resolutionHours: 8.0,  slaBreached: true,  aiProcessingSeconds: 38, aiSuggestionAccepted: false, aiCategoryMatch: false },
  { ticketId: 'TD-001269', title: 'Legacy System Migration Rollback',              category: 'Performance',    date: new Date(Date.now() - 25 * 86400000), status: 'failed',   assignee: DASHBOARD_ASSIGNEES[3], priority: 'critical', firstResponseHours: 0.5, resolutionHours: 20.0, slaBreached: true,  aiProcessingSeconds: 32, aiSuggestionAccepted: false, aiCategoryMatch: true  },

  // ── renew — reopened after solved/failed ─────────────────────────────────
  { ticketId: 'TD-001270', title: 'VPN Issue Recurring – London Office',           category: 'Network',        date: new Date(Date.now() -  1 * 86400000), status: 'renew',    assignee: DASHBOARD_ASSIGNEES[0], priority: 'high',     firstResponseHours: 0.5, slaBreached: false, aiProcessingSeconds: 8,  aiSuggestionAccepted: true,  aiCategoryMatch: true  },
  { ticketId: 'TD-001271', title: 'Two-Factor Auth Still Failing After Fix',       category: 'Authentication', date: new Date(Date.now() -  2 * 86400000), status: 'renew',    assignee: DASHBOARD_ASSIGNEES[2], priority: 'medium',   firstResponseHours: 1.0, slaBreached: false, aiProcessingSeconds: 12, aiSuggestionAccepted: true,  aiCategoryMatch: true  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const AI_SUGGESTIONS: Record<string, AISuggestion> = {
  'TD-001238': { summary: 'User reports VPN connection timeouts after ~2 minutes, preventing access to internal resources. Issue persists after reinstalling VPN client. Work is blocked due to an important deadline.', suggestedSolution: '1. Check VPN server load and session limits\n2. Review VPN client logs for timeout error codes\n3. Verify firewall rules allow persistent VPN sessions\n4. Test alternate VPN gateway endpoints', category: 'Network / VPN', deadline: '2026-02-26', deadlineTime: '17:00' },
  'TD-001239': { summary: 'Email server misconfiguration is causing delivery failures across the organisation. Multiple users affected. SMTP relay settings appear to be the root cause.', suggestedSolution: '1. Audit current SMTP relay configuration\n2. Compare with last known-good config snapshot\n3. Restart mail transfer agent service\n4. Test with internal and external addresses', category: 'Email / SMTP', deadline: '2026-02-25', deadlineTime: '12:00' },
  'TD-001240': { summary: 'A critical security vulnerability has been detected in the production environment. Immediate triage and patching are required to prevent potential data breach.', suggestedSolution: '1. Isolate affected systems immediately\n2. Identify CVE and patch version\n3. Apply emergency patch in staging first\n4. Deploy fix to production and validate', category: 'Security / Vulnerability', deadline: '2026-02-24', deadlineTime: '23:59' },
  'TD-001241': { summary: 'Database connection pool has been exhausted, causing application-level errors. Peak query load is suspected. Connection leak or misconfigured pool size may be involved.', suggestedSolution: '1. Increase connection pool max size temporarily\n2. Identify long-running or leaked connections\n3. Optimise slow queries contributing to pool pressure\n4. Schedule pool tuning during maintenance window', category: 'Database / Performance', deadline: '2026-02-27', deadlineTime: '09:00' },
  'TD-001264': { summary: 'Printer on Floor 3 is showing offline status. Users unable to print. Issue may be related to network connectivity or driver configuration.', suggestedSolution: '1. Check printer network connection and IP assignment\n2. Restart printer spooler service on affected machines\n3. Reinstall printer driver if issue persists\n4. Test with direct USB connection to isolate network vs hardware', category: 'Facilities / Hardware', deadline: '2026-02-28', deadlineTime: '12:00' },
  'TD-001265': { summary: 'User cannot access HR portal after completing a password reset. Authentication appears to succeed but portal redirects to login page repeatedly.', suggestedSolution: '1. Clear browser cache and cookies\n2. Verify password propagation across SSO systems\n3. Check HR portal session token configuration\n4. Manually re-sync user credentials in identity provider', category: 'Authentication / HR', deadline: '2026-02-28', deadlineTime: '17:00' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ORIGINAL MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

export const ORIGINAL_MESSAGES: Record<string, OriginalMessage> = {
  'TD-001238': { from: 'James Harrington', body: "Hi Support Team,\n\nI'm experiencing issues connecting to the company VPN. The connection keeps timing out after about 2 minutes, and I'm unable to access internal resources. I've tried restarting my computer and reinstalling the VPN client, but the problem persists.\n\nThis is blocking my work as I need to access the file server for an important project deadline today.\n\nCould you please help me resolve this urgently?\n\nThanks,\nJames" },
  'TD-001239': { from: 'Laura Benson',     body: "Hi Support,\n\nSince this morning our email service seems to be misconfigured. Outgoing messages to external recipients are bouncing back. Our SMTP relay might be the culprit.\n\nSeveral colleagues are affected and we have time-sensitive client communications pending.\n\nPlease assist as soon as possible.\n\nBest,\nLaura" },
  'TD-001240': { from: 'Security Scanner', body: "AUTOMATED ALERT — CRITICAL\n\nA high-severity vulnerability has been detected in the production environment:\n\n  CVE ID: CVE-2025-XXXX\n  Severity: CRITICAL (CVSS 9.8)\n  Component: Authentication middleware\n  Affected hosts: prod-api-01, prod-api-02\n\nImmediate remediation is required. Please escalate to the security team.\n\n— Automated Security Platform" },
  'TD-001241': { from: 'AppMonitor',       body: "Hi DBA Team,\n\nOur monitoring system has flagged that the database connection pool is now at 100% utilisation. Application errors related to connection acquisition timeouts are appearing in the logs.\n\nThis is causing failures for end-users across multiple services.\n\nKindly investigate and resolve.\n\nRegards,\nApp Monitoring Bot" },
  'TD-001264': { from: 'Mike Torres',      body: "Hi IT,\n\nThe printer on Floor 3 (near the kitchen) has been showing as offline since yesterday afternoon. Multiple colleagues have tried printing and nothing is coming out.\n\nCould someone come take a look?\n\nThanks,\nMike" },
  'TD-001265': { from: 'Priya Nair',       body: "Hello,\n\nI reset my password yesterday as prompted, but now I can't log into the HR portal. It shows the login page, I enter my new credentials, and it just reloads back to the login screen.\n\nI need to submit my timesheet by end of day.\n\nPlease help!\n\nPriya" },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS STYLES
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  draft:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  new:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  assigned: { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  solving:  { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  solved:   { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  failed:   { bg: '#FFF1F2', text: '#E11D48', dot: '#F43F5E' },
  renew:    { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKLOG SUMMARY DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface BacklogStatusMeta {
  label: string;
  target: string;
}

export const BACKLOG_STATUS_META: Record<TicketStatus, BacklogStatusMeta> = {
  draft:    { label: 'Draft',    target: '< 1h' },
  new:      { label: 'New',      target: '< 4h' },
  assigned: { label: 'Assigned', target: '< 8h' },
  solving:  { label: 'Solving',  target: '< 1d' },
  solved:   { label: 'Solved',   target: 'done' },
  failed:   { label: 'Failed',   target: 'done' },
  renew:    { label: 'Renew',    target: '< 4h' },
};

export const BACKLOG_PERIODS: string[] = [
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This year',
];