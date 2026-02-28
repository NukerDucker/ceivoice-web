import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('user_name, full_name')
    .eq('user_id', user?.id)
    .single();

  const displayName = profile?.full_name ?? profile?.user_name ?? 'User';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="user" userName={displayName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
