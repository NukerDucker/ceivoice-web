'use client';

import React from 'react';

interface HeaderProps {
  rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {
  return (
    <div className="relative px-6 pt-6">
      <div className="flex items-center justify-between w-full gap-6 p-4 bg-white rounded-xl shadow-sm">
        <h3 className="text-2xl font-bold">My Requests</h3>
        {rightContent}
      </div>
    </div>
  );
}