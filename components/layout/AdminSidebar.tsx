'use client';

import React, { useState } from 'react';
import { ChevronDown, LayoutDashboard, MessageSquare, BarChart3, User, Bell, Settings } from 'lucide-react';
import Image from 'next/image';
import { menuConfig } from '@/lib/menu-config';

interface SidebarProps {
  userRole?: 'user' | 'admin' | 'assignee';
  userName?: string;
  userAvatar?: string | null; 
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'admin',  // Changed from 'user' to 'admin'
  userName = 'Palm Pollapat',
  userAvatar = null
}) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState(['tickets']);
  const [isMinimized, setIsMinimized] = useState(false);

  const menuItems = menuConfig[userRole] || menuConfig.user;

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
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 shrink-0 "
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
        {menuItems.map((item) => {
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
                    <span className="text-sm font-medium truncate max-w-[140px] overflow-hidden whitespace-nowrap block">{item.label}</span>
                  )}
                </div>

                {!isMinimized && item.hasSubmenu && (
                  <ChevronDown
                    size={16}
                    className={`relative z-10 transition-transform duration-250 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${
                      isActive ? 'text-white/70' : 'text-gray-400'
                    }`}
                  />
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