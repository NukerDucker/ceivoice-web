import { Sidebar } from '@/components/layout/AdminSidebar';
import { createClient } from '@/lib/supabase/server';

// Auth guard: users with role !== "admin" are redirected by middleware.ts

export default async function AdminLayout({
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
    'Admin';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="admin" userName={displayName} />
      <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}