import { Sidebar } from '@/components/layout/AssigneeSidebar';
import { createClient } from '@/lib/supabase/server';

// Auth guard: users with role !== "assignee" are redirected by middleware.ts

export default async function AssigneeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Read display name from JWT user_metadata — no extra DB round-trip needed
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'Assignee';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="assignee" userName={displayName} />
      <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}