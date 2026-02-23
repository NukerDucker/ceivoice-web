/**
 * roleRedirect — determine the correct dashboard URL for a given role.
 *
 * Used after login / OAuth callback to send users to the right landing page.
 */

export type Role = 'user' | 'assignee' | 'admin';

const ROLE_HOME: Record<Role, string> = {
  user:     '/user/dashboard',
  assignee: '/assignee/dashboard',
  admin:    '/admin/dashboard',
};

/**
 * Returns the home URL for the given role.
 * Falls back to /auth/login if the role is unrecognised.
 */
export function getRoleHome(role: string | null | undefined): string {
  if (!role) return '/auth/login';
  return ROLE_HOME[role as Role] ?? '/auth/login';
}
