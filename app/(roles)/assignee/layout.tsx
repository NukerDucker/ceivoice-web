'use client';

import { Sidebar } from '@/components/layout/Sidebar';

// Auth guard: users with role !== "assignee" are redirected by middleware.ts

export default function AssigneeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="assignee" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
