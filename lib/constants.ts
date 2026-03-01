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

// ─── Shared Person type ───────────────────────────────────────────────────────

export interface Person {
  name: string;
  avatar?: string;
  fallback: string;
  role?: string;
}

// ─── Comment type ─────────────────────────────────────────────────────────────

export interface TicketComment {
  id: string;
  ticketId: string;
  author: Person;
  body: string;
  createdAt: Date;
  isInternal: boolean; // public-only shown to user; internal hidden
}

// ─── UserTicket ───────────────────────────────────────────────────────────────

export interface UserTicket {
  ticketId: string;
  title: string;
  category: string | null;
  date: Date;
  status:
    | 'draft'
    | 'new'
    | 'assigned'
    | 'solving'
    | 'solved'
    | 'failed'
    | 'renew';
  assignee: Person;
  creator: Person;
  followers: Person[];
  description?: string;
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
    status: 'solving',
    description:
      'My laptop screen has been flickering intermittently since yesterday morning. It happens most frequently when the laptop is on battery power. The display flickers every 10–20 seconds and sometimes goes black for a split second. Model: Dell XPS 15, Windows 11.',
    assignee: { name: 'Somsak Jaidee', fallback: 'SJ' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [
      { name: 'Nipa Thong', fallback: 'NT' },
      { name: 'Krit Sombat', fallback: 'KS' },
    ],
  },
  {
    ticketId: 'REQ-002',
    title: 'Cannot access internal HR portal',
    category: 'Software',
    date: new Date('2025-02-14'),
    status: 'new',
    description:
      'I am unable to log in to the HR portal at hr.internal.cei.com. The page loads but after entering my credentials I receive "Access denied - contact your administrator". This started after the maintenance window on Feb 13.',
    assignee: { name: 'Unassigned', fallback: 'UA' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [],
  },
  {
    ticketId: 'REQ-003',
    title: 'Request for Adobe Creative Cloud license',
    category: 'Software',
    date: new Date('2025-01-28'),
    status: 'solved',
    description:
      'I need Adobe Creative Cloud (full suite) for my design work on the Q2 campaign. My current trial expires on Feb 15. Please provision a license under the company account.',
    assignee: { name: 'Nipa Thong', fallback: 'NT' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [{ name: 'Somsak Jaidee', fallback: 'SJ' }],
  },
  {
    ticketId: 'REQ-004',
    title: 'VPN connection drops every 30 minutes',
    category: 'Network',
    date: new Date('2025-02-18'),
    status: 'assigned',
    description:
      'My VPN (Cisco AnyConnect) disconnects exactly every ~30 minutes, forcing me to reconnect. This is very disruptive during video calls. I am on macOS 14.3, office Wi-Fi and home network both affected.',
    assignee: { name: 'Krit Sombat', fallback: 'KS' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [{ name: 'Nipa Thong', fallback: 'NT' }],
  },
  {
    ticketId: 'REQ-005',
    title: 'New employee onboarding equipment setup',
    category: 'Hardware',
    date: new Date('2025-01-15'),
    status: 'solved',
    description:
      'New team member joining on Jan 20: Ananya Srirak (ananya.s@cei.com). Please provision: 1x MacBook Pro 14", 1x external monitor, keyboard & mouse, and access badge.',
    assignee: { name: 'Somsak Jaidee', fallback: 'SJ' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [
      { name: 'Krit Sombat', fallback: 'KS' },
      { name: 'Nipa Thong', fallback: 'NT' },
    ],
  },
  {
    ticketId: 'REQ-006',
    title: 'Printer on 3rd floor not responding',
    category: 'Hardware',
    date: new Date('2025-02-20'),
    status: 'draft',
    description:
      'The HP LaserJet on 3rd floor (near meeting room B) shows "offline" status for everyone on the floor. Last print job was yesterday at 4pm. The printer has power and the display shows no errors.',
    assignee: { name: 'Unassigned', fallback: 'UA' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [],
  },
  {
    ticketId: 'REQ-007',
    title: 'Email client crashing on startup',
    category: 'Software',
    date: new Date('2025-02-22'),
    status: 'renew',
    description:
      'Outlook 365 crashes immediately on launch. I already tried the Quick Repair in Windows Apps & Features — no change. The crash started after a Windows Update on Feb 21. Event Viewer shows: "AppCrash OUTLOOK.EXE".',
    assignee: { name: 'Nipa Thong', fallback: 'NT' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [{ name: 'Somsak Jaidee', fallback: 'SJ' }],
  },
  {
    ticketId: 'REQ-008',
    title: 'Conference room TV display not working',
    category: 'Hardware',
    date: new Date('2025-02-05'),
    status: 'failed',
    description:
      'The Samsung 75" display in Conference Room A (4th floor) does not turn on. The power LED blinks red 3 times repeatedly. HDMI inputs were tested with a different laptop — same result. Needs hardware inspection.',
    assignee: { name: 'Krit Sombat', fallback: 'KS' },
    creator: { name: 'Palm Pollapat', fallback: 'PP', role: 'Requester' },
    followers: [],
  },
];

// ─── Mock Comments ────────────────────────────────────────────────────────────

export const MOCK_COMMENTS: TicketComment[] = [
  // REQ-001
  {
    id: 'c-001-1',
    ticketId: 'REQ-001',
    author: { name: 'Somsak Jaidee', fallback: 'SJ' },
    body: "Hi Palm, I've picked up this ticket. Can you confirm: does the flickering happen on external monitor too, or only the built-in display?",
    createdAt: new Date('2025-02-10T09:15:00'),
    isInternal: false,
  },
  {
    id: 'c-001-2',
    ticketId: 'REQ-001',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: "Only the built-in display. External monitor (connected via USB-C) is fine. Also worth noting: it flickers more when I'm running on battery vs plugged in.",
    createdAt: new Date('2025-02-10T09:42:00'),
    isInternal: false,
  },
  {
    id: 'c-001-3',
    ticketId: 'REQ-001',
    author: { name: 'Somsak Jaidee', fallback: 'SJ' },
    body: "That narrows it down to the GPU power management. I've updated your display driver remotely. Please restart and let me know if the flickering persists.",
    createdAt: new Date('2025-02-11T14:00:00'),
    isInternal: false,
  },
  {
    id: 'c-001-4',
    ticketId: 'REQ-001',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: 'Restarted — it seemed okay for a few hours but just flickered again. Less frequent, but still happening.',
    createdAt: new Date('2025-02-12T16:30:00'),
    isInternal: false,
  },

  // REQ-002
  {
    id: 'c-002-1',
    ticketId: 'REQ-002',
    author: { name: 'IT Support Bot', fallback: 'IT' },
    body: "Your request has been received and logged. Estimated response time is 1 business day. Ticket ID: REQ-002.",
    createdAt: new Date('2025-02-14T08:00:00'),
    isInternal: false,
  },

  // REQ-003
  {
    id: 'c-003-1',
    ticketId: 'REQ-003',
    author: { name: 'Nipa Thong', fallback: 'NT' },
    body: "Hi Palm, I've submitted the license request to our Adobe account manager. Approval usually takes 1–2 days.",
    createdAt: new Date('2025-01-28T10:20:00'),
    isInternal: false,
  },
  {
    id: 'c-003-2',
    ticketId: 'REQ-003',
    author: { name: 'Nipa Thong', fallback: 'NT' },
    body: 'License approved and assigned! You should receive an activation email at your company address within the hour.',
    createdAt: new Date('2025-01-30T15:05:00'),
    isInternal: false,
  },
  {
    id: 'c-003-3',
    ticketId: 'REQ-003',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: 'Got it — activated and working perfectly. Thank you!',
    createdAt: new Date('2025-01-30T16:00:00'),
    isInternal: false,
  },

  // REQ-004
  {
    id: 'c-004-1',
    ticketId: 'REQ-004',
    author: { name: 'Krit Sombat', fallback: 'KS' },
    body: "Acknowledged. This sounds like the known AnyConnect idle-timeout issue. I'll schedule a remote session to adjust your VPN profile settings.",
    createdAt: new Date('2025-02-18T11:00:00'),
    isInternal: false,
  },
  {
    id: 'c-004-2',
    ticketId: 'REQ-004',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: 'Sounds good, I am available anytime after 2pm today.',
    createdAt: new Date('2025-02-18T11:15:00'),
    isInternal: false,
  },

  // REQ-005
  {
    id: 'c-005-1',
    ticketId: 'REQ-005',
    author: { name: 'Somsak Jaidee', fallback: 'SJ' },
    body: "All equipment is ready and staged. I'll deliver to Ananya's desk on Jan 20 between 8–9am before she arrives.",
    createdAt: new Date('2025-01-17T13:30:00'),
    isInternal: false,
  },
  {
    id: 'c-005-2',
    ticketId: 'REQ-005',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: 'Perfect, she starts at 9am. That timing works great, thank you!',
    createdAt: new Date('2025-01-17T14:00:00'),
    isInternal: false,
  },
  {
    id: 'c-005-3',
    ticketId: 'REQ-005',
    author: { name: 'Somsak Jaidee', fallback: 'SJ' },
    body: 'Setup complete. MacBook, monitor, peripherals, and badge all delivered and configured. Marking as solved.',
    createdAt: new Date('2025-01-20T09:45:00'),
    isInternal: false,
  },

  // REQ-006 — no comments yet (draft)

  // REQ-007
  {
    id: 'c-007-1',
    ticketId: 'REQ-007',
    author: { name: 'Nipa Thong', fallback: 'NT' },
    body: "I ran the Online Repair on your Outlook installation — it completed successfully. Please try launching Outlook now and let me know.",
    createdAt: new Date('2025-02-22T10:00:00'),
    isInternal: false,
  },
  {
    id: 'c-007-2',
    ticketId: 'REQ-007',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: 'It worked for two days but has started crashing again today. Same error in Event Viewer.',
    createdAt: new Date('2025-02-24T09:10:00'),
    isInternal: false,
  },
  {
    id: 'c-007-3',
    ticketId: 'REQ-007',
    author: { name: 'Nipa Thong', fallback: 'NT' },
    body: "Understood — I'm reopening this ticket and will escalate to a full reinstall. I'll reach out to schedule a time.",
    createdAt: new Date('2025-02-24T09:35:00'),
    isInternal: false,
  },

  // REQ-008
  {
    id: 'c-008-1',
    ticketId: 'REQ-008',
    author: { name: 'Krit Sombat', fallback: 'KS' },
    body: "Inspected the unit on-site. The 3x red blink pattern indicates a main board failure. This TV is out of warranty and the repair cost exceeds replacement cost. Recommending procurement of a new unit.",
    createdAt: new Date('2025-02-07T11:30:00'),
    isInternal: false,
  },
  {
    id: 'c-008-2',
    ticketId: 'REQ-008',
    author: { name: 'Palm Pollapat', fallback: 'PP' },
    body: "Understood. Is there a temporary display we can use in that room while procurement is in progress?",
    createdAt: new Date('2025-02-07T12:00:00'),
    isInternal: false,
  },
  {
    id: 'c-008-3',
    ticketId: 'REQ-008',
    author: { name: 'Krit Sombat', fallback: 'KS' },
    body: "Unfortunately we don't have a spare of that size. I'm escalating the procurement request but cannot resolve this ticket from IT's side. Closing as failed — the hardware issue requires a procurement decision.",
    createdAt: new Date('2025-02-08T09:00:00'),
    isInternal: false,
  },
];