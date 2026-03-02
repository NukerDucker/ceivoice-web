import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  MessageSquare,
  Inbox,
  Users,
  BarChart3,
  BarChart2,
  Settings,
  LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

/** @deprecated Use Role from '@/types' instead */
export type UserRole = Role;

export const menuConfig: Record<Role, MenuItem[]> = {
  user: [
    { id: 'my-requests',   label: 'My Requests',   icon: ClipboardList,   path: '/user/my-request'      },
    { id: 'notifications', label: 'Notifications', icon: Bell,            path: '/user/notification' },
    { id: 'my-profile',    label: 'My Profile',    icon: User,            path: '/user/profile'       },
  ],

  admin: [
    { id: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard, path: '/admin/dashboard'       },
    { id: 'tickets',       label: 'All Tickets',       icon: MessageSquare,   path: '/admin/tickets'        },
    { id: 'drafts',        label: 'Draft Tickets',     icon: Inbox,           path: '/admin/draft'          },
    { id: 'users',         label: 'User Management',   icon: Users,           path: '/admin/user-management' },
    { id: 'reports',       label: 'Reports',           icon: BarChart3,       path: '/admin/report'         },
    { id: 'notifications', label: 'Notifications',     icon: Bell,            path: '/admin/notification'   },
    { id: 'settings',      label: 'Settings',          icon: Settings,        path: '/admin/settings'       },
  ],

  assignee: [
    { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, path: '/assignee/dashboard'    },
    { id: 'performance',  label: 'My Performance', icon: BarChart2,       path: '/assignee/performance'  },
    { id: 'notification', label: 'Notification',   icon: Bell,            path: '/assignee/notification' },
  ],
};