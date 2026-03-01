'use client';

import { Sidebar } from '@/components/layout/AdminSidebar';

// Auth guard: users with role !== "admin" are redirected by middleware.ts

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
        <Sidebar userRole="admin" userName="Palm Pollapat" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
