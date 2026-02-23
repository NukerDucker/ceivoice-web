/**
 * Authentication service
 *
 * All auth calls go through the Next.js API proxy routes at /api/auth/*.
 * Those routes talk to the backend and store the JWT tokens as httpOnly
 * cookies on the Next.js origin — browser JavaScript never sees a raw token.
 *
 * Same-origin requests to /api/* automatically include cookies, so no
 * `credentials: "include"` is required here.
 */

// Next.js proxy prefix — same origin, no CORS
const AUTH_PROXY = '/api/auth';

// ===== TYPES =====

export interface UserProfile {
  user_id: number;
  email: string;
  name: string | null;
  role: string;
}

// ===== AUTH API CALLS =====

/**
 * Login with email + password.
 * The /api/auth/login proxy sets access_token / refresh_token httpOnly cookies.
 * Returns the user profile; tokens are never exposed to JavaScript.
 */
export const login = async (email: string, password: string): Promise<UserProfile> => {
  const res = await fetch(`${AUTH_PROXY}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string; error?: string }).message ??
      (data as { error?: string }).error ??
      'Login failed'
    );
  }

  const data = await res.json();
  return (data as { user: UserProfile }).user;
};

/**
 * Register a new account.
 * Same cookie behaviour as login.
 */
export const register = async (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<UserProfile> => {
  const res = await fetch(`${AUTH_PROXY}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: name, email, password, confirmPassword }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string; error?: string }).message ??
      (data as { error?: string }).error ??
      'Registration failed'
    );
  }

  const data = await res.json();
  return (data as { user: UserProfile }).user;
};

/**
 * Fetch the current user's profile.
 * The access_token cookie is sent automatically (same-origin).
 * Throws if the user is not authenticated.
 */
export const getMe = async (): Promise<UserProfile> => {
  const res = await fetch(`${AUTH_PROXY}/me`);

  if (!res.ok) throw new Error('Unauthorized');

  return res.json() as Promise<UserProfile>;
};

/**
 * Logout — calls the proxy which clears the httpOnly cookies server-side.
 */
export const logout = async (): Promise<void> => {
  await fetch(`${AUTH_PROXY}/logout`, { method: 'POST' });
};

/**
 * Silently refresh the access token using the refresh_token cookie.
 * Call this when a protected fetch returns 401.
 */
export const refreshAccessToken = async (): Promise<void> => {
  const res = await fetch(`${AUTH_PROXY}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Session expired');
};

/**
 * Redirect the browser to the backend Google OAuth entry point.
 * Passport.js handles the Google handshake; after success the backend
 * redirects to /callback which sets httpOnly cookies and goes to /auth-success.
 */
export const loginWithGoogle = (): void => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
  globalThis.location.href = `${apiUrl}/auth/google`;
};