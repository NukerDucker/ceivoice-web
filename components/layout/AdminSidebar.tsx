'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  Inbox,
  Users,
  LogOut,
  LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  userRole?: 'user' | 'admin' | 'assignee';
  userName?: string;
  userAvatar?: string | null;
}

interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const ADMIN_ITEMS: AdminNavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard, path: '/admin/dashboard'      },
  { id: 'tickets',       label: 'All Tickets',     icon: MessageSquare,   path: '/admin/tickets'        },
  { id: 'drafts',        label: 'Draft Tickets',   icon: Inbox,           path: '/admin/draft'          },
  { id: 'users',         label: 'User Management', icon: Users,           path: '/admin/user-management' },
  { id: 'reports',       label: 'Reports',         icon: BarChart3,       path: '/admin/report'          },
  { id: 'notifications', label: 'Notifications',   icon: Bell,            path: '/admin/notification'    },
  { id: 'settings',      label: 'Settings',        icon: Settings,        path: '/admin/settings'        },
];

export const Sidebar: React.FC<SidebarProps> = ({
  userName = 'Admin',
  userAvatar = null,
}) => {
  const pathname = usePathname();
  const router   = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const activeId = ADMIN_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/')
  )?.id ?? 'dashboard';

  return (
    <div className={`relative h-screen bg-linear-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
      isMinimized ? 'w-17' : 'w-72'
    }`}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 h-52 bg-linear-to-b from-orange-500/8 via-orange-500/4 to-transparent pointer-events-none" />

      {/* Logo & Minimize */}
      <div className="relative z-10 px-5 py-6 flex items-center justify-between gap-3 border-b border-gray-200">
        {!isMinimized && (
          <Image src="/ceivoice-logo.png" alt="CEIVoice" width={150} height={150} />
        )}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 shrink-0"
          title={isMinimized ? 'Expand' : 'Minimize'}
        >
          <ChevronDown
            size={20}
            className={`text-gray-600 transition-transform ${isMinimized ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
      </div>

      {/* Nav items */}
      <nav className="relative z-10 flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto">
        {ADMIN_ITEMS.map((item) => {
          const Icon     = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              title={isMinimized ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden group ${
                isActive
                  ? 'bg-linear-to-r from-gray-900 to-gray-800 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {!isActive && (
                <div className="absolute inset-0 bg-linear-to-r from-orange-500/8 to-orange-400/8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              )}
              <Icon size={20} className="relative z-10 shrink-0" />
              {!isMinimized && (
                <span className="relative z-10 text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile + Logout */}
      <div className="relative z-10 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md">
            {userAvatar ? (
              <Image src={userAvatar} alt={userName} width={36} height={36} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!isMinimized && (
            <span className="text-sm font-semibold text-gray-900 truncate flex-1">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
