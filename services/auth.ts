/**
 * Authentication service
 *
 * Tokens are stored exclusively in httpOnly cookies set by the backend.
 * The browser sends them automatically on every same-origin / credentialed
 * request — frontend JavaScript never reads or writes them directly.
 *
 * All fetch calls use `credentials: "include"` so that the
 * browser attaches the cookies on cross-origin requests to the API.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// ===== TYPES =====

export interface UserProfile {
  user_id: number;
  email: string;
  name: string | null;
  role: string;
}

// ===== SHARED FETCH OPTIONS =====

const CREDENTIALS_OPTS: RequestInit = {
  credentials: "include",   // Always send the httpOnly cookie cross-origin
  headers: { "Content-Type": "application/json" }
};

// ===== AUTH API CALLS =====

/**
 * Login with email + password.
 * The backend sets access_token / refresh_token httpOnly cookies in the response.
 * Returns the user profile; tokens are never exposed to JavaScript.
 */
export const login = async (email: string, password: string): Promise<UserProfile> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    ...CREDENTIALS_OPTS,
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string; error?: string }).message ?? (data as { error?: string }).error ?? "Login failed");
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
  const res = await fetch(`${API_URL}/auth/register`, {
    ...CREDENTIALS_OPTS,
    method: "POST",
    body: JSON.stringify({ fullName: name, email, password, confirmPassword })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string; error?: string }).message ?? (data as { error?: string }).error ?? "Registration failed");
  }

  const data = await res.json();
  return (data as { user: UserProfile }).user;
};

/**
 * Fetch the current user's profile.
 * The browser attaches the access_token cookie automatically.
 * Throws if the user is not authenticated.
 */
export const getMe = async (): Promise<UserProfile> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include"
  });

  if (!res.ok) throw new Error("Unauthorized");

  const data = await res.json();
  // /auth/me returns { user_id, email, name, role, ... } directly
  return data as UserProfile;
};

/**
 * Logout — asks the backend to clear the httpOnly cookies.
 * Because httpOnly cookies cannot be deleted by JavaScript, a server-side
 * call is the only reliable way to invalidate the session.
 */
export const logout = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout`, {
    ...CREDENTIALS_OPTS,
    method: "POST"
  });
  // No local state to clear — cookies are gone after the response
};

/**
 * Silently refresh the access token using the refresh_token cookie.
 * Call this when a protected fetch returns 401.
 */
export const refreshAccessToken = async (): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    ...CREDENTIALS_OPTS,
    method: "POST",
    body: JSON.stringify({}) // refresh_token is read from cookie server-side
  });

  if (!res.ok) throw new Error("Session expired");
};

/**
 * Convenience: redirect to Google OAuth.
 * The full-page navigation carries the cookies correctly and the
 * backend sets new ones after the OAuth handshake completes.
 */
export const loginWithGoogle = (): void => {
  globalThis.location.href = `${API_URL}/auth/google`;
};