'use client';

import React, { useState } from 'react';
import { ChevronDown, LayoutDashboard, BarChart2, Bell, LogOut, LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  userName?: string;
  userAvatar?: string | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const ASSIGNEE_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, path: '/assignee/dashboard'    },
  { id: 'performance',  label: 'My Performance', icon: BarChart2,       path: '/assignee/performance'  },
  { id: 'notification', label: 'Notification',   icon: Bell,            path: '/assignee/notification' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  userName = 'Assignee',
  userAvatar = null,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const activeId = ASSIGNEE_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/'),
  )?.id ?? 'dashboard';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={`relative h-screen bg-linear-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
      isMinimized ? 'w-17' : 'w-72'
    }`}>
      {/* Gradient overlay background */}
      <div className="absolute inset-0 h-52 bg-linear-to-b from-orange-500/8 via-orange-500/4 to-transparent pointer-events-none" />

      {/* Logo & Minimize Button */}
      <div className="relative z-10 px-5 py-6 flex items-center justify-between gap-3 border-b border-gray-200">
        {!isMinimized && (
          <Image
            src="/ceivoice-logo.png"
            alt="CEIVoice"
            width={150}
            height={150}
          />
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

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {ASSIGNEE_ITEMS.map((item) => {
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
                <div className="absolute inset-0 bg-linear-to-r from-orange-500/8 to-orange-400/8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
              )}
              <Icon size={20} className="relative z-10 shrink-0" />
              {!isMinimized && (
                <span className="relative z-10 text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
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
