'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { menuConfig } from '@/lib/menu-config';
import type { Role } from '@/types';

export interface SidebarProps {
  role: Role;
  userName?: string;
  userAvatar?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  userName = 'User',
  userAvatar = null,
}) => {
  const pathname = usePathname();
  const router   = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMore,    setShowMore]    = useState(false);

  const items    = menuConfig[role];
  const activeId = items.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/')
  )?.id ?? items[0]?.id;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // First 4 in bottom bar, rest in More drawer
  const tabItems  = items.slice(0, 4);
  const moreItems = items.slice(4);

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP SIDEBAR — hidden on mobile
      ───────────────────────────────────────── */}
      <div className={`hidden md:flex relative h-screen bg-linear-to-b from-white to-gray-50 border-r border-gray-200 flex-col overflow-hidden transition-all duration-300 ${
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
        <nav className="relative z-10 flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {items.map((item) => {
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

        {/* User profile + Logout */}
        <div className="relative z-10 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full"
                />
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

      {/* ─────────────────────────────────────────
          MOBILE BOTTOM TAB BAR — hidden on desktop
      ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

        {/* More drawer */}
        {showMore && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowMore(false)} />
            <div className="absolute bottom-full left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-700">More</span>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Items */}
              <div className="px-4 py-3 flex flex-col gap-1">
                {moreItems.map((item) => {
                  const Icon     = item.icon;
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.path); setShowMore(false); }}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-orange-50 text-orange-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <Icon size={18} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom safe area */}
              <div className="h-4" />
            </div>
          </>
        )}

        {/* Bottom tab bar */}
        <div className="flex items-center justify-around px-2 py-1 pb-safe">
          {tabItems.map((item) => {
            const Icon     = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] relative"
              >
                {isActive && (
                  <span className="absolute inset-0 bg-orange-500/10 rounded-xl" />
                )}
                <Icon
                  size={22}
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? 'text-orange-500 scale-110' : 'text-gray-400'
                  }`}
                />
                <span className={`relative z-10 text-[10px] font-medium leading-none ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          {moreItems.length > 0 && (
            <button
              onClick={() => setShowMore((o) => !o)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] relative"
            >
              {showMore && <span className="absolute inset-0 bg-orange-500/10 rounded-xl" />}
              <span className={`relative z-10 text-lg font-bold leading-none tracking-widest ${
                showMore ? 'text-orange-500' : 'text-gray-400'
              }`}>···</span>
              <span className={`relative z-10 text-[10px] font-medium leading-none ${
                showMore ? 'text-orange-500' : 'text-gray-400'
              }`}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};