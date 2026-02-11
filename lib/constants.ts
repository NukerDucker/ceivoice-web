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

// Mock User Data
export const mockUsers = [
    {
        name: "shadcn",
        avatar: "https://github.com/shadcn.png",
        fallback: "SC"
    },
    {
        name: "Palm Pollapat",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Palm",
        fallback: "PP"
    },
    {
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        fallback: "JD"
    },
    {
        name: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        fallback: "SS"
    }
];

// Mock Ticket Data
export const mockTickets: UserTicket[] = [
    {
        ticketId: "TD-001238",
        title: "VPN Connection Timeout",
        category: "Network",
        date: new Date('2024-01-30T08:15:00'),
        status: "submitted",
        assignee: mockUsers[0]
    },
    {
        ticketId: "TD-001239",
        title: "Email Server Configuration",
        category: "Email",
        date: new Date('2024-01-29T14:30:00'),
        status: "in-progress",
        assignee: mockUsers[1]
    },
    {
        ticketId: "TD-001240",
        title: "Database Connection Pool Issue",
        category: "Database",
        date: new Date('2024-01-28T10:45:00'),
        status: "resolved",
        assignee: mockUsers[2]
    },
    {
        ticketId: "TD-001241",
        title: "Critical Security Vulnerability",
        category: "Security",
        date: new Date('2024-01-27T16:20:00'),
        status: "critical",
        assignee: mockUsers[3]
    },
    {
        ticketId: "TD-001242",
        title: "Application Performance Slow",
        category: "Performance",
        date: new Date('2024-01-26T09:00:00'),
        status: "in-progress",
        assignee: mockUsers[1]
    },
    {
        ticketId: "TD-001243",
        title: "User Authentication Failed",
        category: "Authentication",
        date: new Date('2024-01-25T11:30:00'),
        status: "submitted",
        assignee: mockUsers[0]
    },
    {
        ticketId: "TD-001244",
        title: "API Gateway Timeout Error",
        category: "Network",
        date: new Date('2024-01-24T15:45:00'),
        status: "critical",
        assignee: mockUsers[2]
    },
    {
        ticketId: "TD-001245",
        title: "File Upload Size Limit Issue",
        category: "Storage",
        date: new Date('2024-01-23T13:20:00'),
        status: "in-progress",
        assignee: mockUsers[3]
    },
    {
        ticketId: "TD-001246",
        title: "Mobile App Crash on Startup",
        category: "Mobile",
        date: new Date('2024-01-22T08:00:00'),
        status: "submitted",
        assignee: mockUsers[1]
    }
];