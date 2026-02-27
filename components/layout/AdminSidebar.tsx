'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  User,
  Bell,
  Settings,
  Inbox,
  Users,
  UserCog,
} from 'lucide-react';
import Image from 'next/image';
import { menuConfig } from '@/lib/menu-config';

interface SidebarProps {
  userRole?: 'user' | 'admin' | 'assignee';
  userName?: string;
  userAvatar?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'admin',
  userName = 'Palm Pollapat',
  userAvatar = null,
}) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['tickets']);
  const [isMinimized, setIsMinimized] = useState(false);

  const menuItems = menuConfig[userRole] || menuConfig.user;

  // For admin, replace menuConfig order with a fixed explicit order
  const adminItems = userRole === 'admin' ? [
    { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard, hasSubmenu: false },
    { id: 'tickets',    label: 'All Tickets',      icon: MessageSquare,   hasSubmenu: false },
    { id: 'drafts',     label: 'Draft Tickets',    icon: Inbox,           hasSubmenu: false },
    { id: 'users',      label: 'User Management',  icon: Users,           hasSubmenu: false },
    { id: 'assignees',  label: 'Assignee Roles',   icon: UserCog,         hasSubmenu: false },
    { id: 'reports',    label: 'Reports',          icon: BarChart3,       hasSubmenu: false },
    { id: 'notifications', label: 'Notifications', icon: Bell,            hasSubmenu: false },
    { id: 'settings',   label: 'Settings',         icon: Settings,        hasSubmenu: false },
  ] : null;

  const allItems = adminItems ?? menuItems;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
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
          {isMinimized ? (
            <ChevronDown size={20} className="text-gray-600 -rotate-90" />
          ) : (
            <ChevronDown size={20} className="text-gray-600 rotate-90" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          const isExpanded = expandedMenus.includes(item.id);

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => {
                  handleMenuClick(item.id);
                  if (item.hasSubmenu) toggleMenu(item.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-250 relative overflow-hidden group ${
                  isActive
                    ? 'bg-linear-to-r from-gray-900 to-gray-800 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={isMinimized ? item.label : undefined}
              >
                {/* Hover background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-linear-to-r from-orange-500/8 to-orange-400/8 opacity-0 group-hover:opacity-100 transition-opacity duration-250 rounded-lg" />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon size={20} className="shrink-0" />
                  {!isMinimized && (
                    <span className="text-sm font-medium truncate max-w-[140px] overflow-hidden whitespace-nowrap block">
                      {item.label}
                    </span>
                  )}
                </div>

                {!isMinimized && (
                  <div className="relative z-10 flex items-center gap-2">
                    {/* Badge for draft count */}
                    {'badge' in item && (item as { badge?: number }).badge != null && (
                      <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {(item as { badge?: number }).badge}
                      </span>
                    )}
                    {/* Chevron for submenus */}
                    {item.hasSubmenu && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-250 ${
                          isExpanded ? 'rotate-180' : ''
                        } ${
                          isActive ? 'text-white/70' : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="relative z-10 px-3 py-4 border-t border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <div className="flex items-center justify-center gap-3">
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
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate block">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};