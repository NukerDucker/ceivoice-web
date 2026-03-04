// ceivoice-web/services/auth.ts
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

  // onboarding_completed lives in the DB, not the JWT — query it directly
  const { data: dbUser } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single();

  return {
    user_id: user.id,
    email: user.email ?? '',
    role: ((jwt.app_role ?? 'user') as string).toLowerCase(),
    onboarding_completed: (dbUser?.onboarding_completed ?? false) as boolean,
  };
};

export type UserProfile = Awaited<ReturnType<typeof getMe>>;

// ─── Password Reset Flow ──────────────────────────────────────────────────────

/**
 * Step 1 — Send a 6-digit OTP to the user's email.
 * shouldCreateUser: false so only existing accounts can trigger a reset.
 */
export const sendPasswordResetOtp = async (email: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
};

/**
 * Step 2 — Verify the OTP the user typed in.
 * On success, Supabase sets an active session so updatePassword can run.
 */
export const verifyPasswordResetOtp = async (email: string, token: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw new Error(error.message);
};

/**
 * Step 3 — Set the new password. Requires an active session from verifyOtp.
 */
export const updatePassword = async (newPassword: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};