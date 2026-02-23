'use client';

// RoleGuard — wrap a component or section to restrict access by role.
// Middleware handles route-level protection; use this for UI-level guards.

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type Role = 'user' | 'assignee' | 'admin';

interface RoleGuardProps {
  allowedRoles: Role[];
  currentRole: Role | null;
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  allowedRoles,
  currentRole,
  children,
  redirectTo = '/auth/login',
}: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (currentRole && !allowedRoles.includes(currentRole)) {
      router.replace(redirectTo);
    }
  }, [currentRole, allowedRoles, redirectTo, router]);

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return null;
  }

  return <>{children}</>;
}
