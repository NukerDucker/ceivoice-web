import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  onboarding_completed: boolean;
}

function claimsFromToken(accessToken: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(accessToken.split('.')[1])) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const login = async (email: string, password: string): Promise<UserProfile> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Login failed');

  const claims = claimsFromToken(data.session.access_token);

  return {
    user_id: data.user.id,
    email: data.user.email ?? '',
    name: (data.user.user_metadata?.name as string | null) ?? null,
    role: (claims.app_role as string | undefined) ?? 'user',
    onboarding_completed: (claims.onboarding_completed as boolean | undefined) ?? false,
  };
};

export const register = async (
  name: string,
  email: string,
  password: string,
  _confirmPassword: string
): Promise<UserProfile> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed');

  const claims = data.session ? claimsFromToken(data.session.access_token) : {};

  return {
    user_id: data.user.id,
    email: data.user.email ?? '',
    name,
    role: (claims.app_role as string | undefined) ?? 'user',
    onboarding_completed: (claims.onboarding_completed as boolean | undefined) ?? false,
  };
};

export const getMe = async (): Promise<UserProfile> => {
  const supabase = createClient();
  const { data: { user, session }, error } = await supabase.auth.getUser().then(async (u) => {
    const s = await supabase.auth.getSession();
    return { data: { user: u.data.user, session: s.data.session }, error: u.error };
  });

  if (error || !user || !session) throw new Error('Unauthorized');

  const claims = claimsFromToken(session.access_token);

  return {
    user_id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | null) ?? null,
    role: (claims.app_role as string | undefined) ?? 'user',
    onboarding_completed: (claims.onboarding_completed as boolean | undefined) ?? false,
  };
};

export const logout = async (): Promise<void> => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const loginWithGoogle = (): void => {
  const supabase = createClient();
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
};
