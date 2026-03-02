// ceivoice-web/services/auth.service.ts
import { createClient } from '@/lib/supabase/client';

export const loginWithEmail = async (email: string, password: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
};

export const registerWithEmail = async (full_name: string, user_name: string, email: string, password: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, user_name, onboarding_completed: true } },
  });
  if (error) throw new Error(error.message);
};

export const loginWithGoogle = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
};

export const logout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
};

// Use this anywhere you need the current user + role
export const getMe = async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token
    ? JSON.parse(atob(session.access_token.split('.')[1]))
    : {};

  return {
    user_id: user.id,
    email: user.email ?? '',
    role: (jwt.app_role ?? 'user') as string,
    onboarding_completed: (jwt.onboarding_completed ?? false) as boolean,
  };
};

export type UserProfile = Awaited<ReturnType<typeof getMe>>;