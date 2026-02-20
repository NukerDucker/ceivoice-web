import {
  LayoutDashboard,
  Ticket,
  User,
  Bell,
  Settings,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
}

export type UserRole = 'user' | 'admin' | 'assignee';

export const menuConfig: Record<UserRole, MenuItem[]> = {
  user: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Ticket,
      path: '/tickets',
      hasSubmenu: true,
      submenu: [
        {
          id: 'my-tickets',
          label: 'My Tickets',
          icon: Ticket,
          path: '/tickets/my-tickets',
        },
        {
          id: 'open-tickets',
          label: 'Open Tickets',
          icon: Ticket,
          path: '/tickets/open',
        },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      hasSubmenu: true,
      submenu: [
        {
          id: 'my-profile',
          label: 'My Profile',
          icon: User,
          path: '/profile',
        },
        {
          id: 'preferences',
          label: 'Preferences',
          icon: Settings,
          path: '/profile/preferences',
        },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      hasSubmenu: true,
      submenu: [
        {
          id: 'all-notifications',
          label: 'All',
          icon: Bell,
          path: '/notifications',
        },
        {
          id: 'unread',
          label: 'Unread',
          icon: Bell,
          path: '/notifications/unread',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ],

  admin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: MessageSquare,
      path: '/admin/tickets',
      hasSubmenu: true,
      submenu: [
        {
          id: 'all-tickets',
          label: 'All Tickets',
          icon: MessageSquare,
          path: '/admin/tickets',
        },
        {
          id: 'assigned',
          label: 'Assigned',
          icon: MessageSquare,
          path: '/admin/tickets/assigned',
        },
        {
          id: 'pending',
          label: 'Pending',
          icon: MessageSquare,
          path: '/admin/tickets/pending',
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      path: '/admin/reports',
      hasSubmenu: true,
      submenu: [
        {
          id: 'activity',
          label: 'Activity Report',
          icon: BarChart3,
          path: '/admin/reports/activity',
        },
        {
          id: 'usage',
          label: 'Usage Report',
          icon: BarChart3,
          path: '/admin/reports/usage',
        },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/admin/profile',
      hasSubmenu: true,
      submenu: [
        {
          id: 'my-profile',
          label: 'My Profile',
          icon: User,
          path: '/admin/profile',
        },
        {
          id: 'preferences',
          label: 'Preferences',
          icon: Settings,
          path: '/admin/profile/preferences',
        },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      hasSubmenu: true,
      submenu: [
        {
          id: 'all-notifications',
          label: 'All',
          icon: Bell,
          path: '/admin/notifications',
        },
        {
          id: 'unread',
          label: 'Unread',
          icon: Bell,
          path: '/admin/notifications/unread',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      hasSubmenu: true,
      submenu: [
        {
          id: 'system',
          label: 'System Settings',
          icon: Settings,
          path: '/admin/settings/system',
        },
        {
          id: 'security',
          label: 'Security',
          icon: Settings,
          path: '/admin/settings/security',
        },
      ],
    },
  ],

  assignee: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/assignee/dashboard',
    },
    {
      id: 'assigned-tickets',
      label: 'Assigned Tickets',
      icon: Ticket,
      path: '/assignee/tickets',
      hasSubmenu: true,
      submenu: [
        {
          id: 'active',
          label: 'Active',
          icon: Ticket,
          path: '/assignee/tickets/active',
        },
        {
          id: 'completed',
          label: 'Completed',
          icon: Ticket,
          path: '/assignee/tickets/completed',
        },
        {
          id: 'on-hold',
          label: 'On Hold',
          icon: Ticket,
          path: '/assignee/tickets/on-hold',
        },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      icon: Users,
      path: '/assignee/team',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/assignee/profile',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/assignee/settings',
    },
  ],
};