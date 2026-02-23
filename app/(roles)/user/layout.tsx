'use client';

import { Sidebar } from '@/components/layout/Sidebar';

// Auth guard: users with role !== "user" are redirected by middleware.ts

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="user" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
