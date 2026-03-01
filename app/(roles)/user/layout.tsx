import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function UserLayout({
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
    'User';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="user" userName={displayName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
