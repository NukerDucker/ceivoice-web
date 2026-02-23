'use client';

/**
 * useUser — returns the currently authenticated user's profile.
 *
 * Wraps the /auth/me call (or your auth provider's session hook) and
 * provides a stable reference to the user object across renders.
 */

import { useState, useEffect } from 'react';
import { getMe, type UserProfile } from '@/services/auth';

interface UseUserResult {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMe()
      .then((u) => { if (!cancelled) { setUser(u); setError(null); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load user');
          setUser(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { user, loading, error, refetch: () => setTick((t) => t + 1) };
}
