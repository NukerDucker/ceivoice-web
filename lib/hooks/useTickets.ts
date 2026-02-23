'use client';

/**
 * useTickets — fetches and manages ticket data.
 *
 * Calls the local /api/tickets route handler which proxies to the backend.
 */

import { useState, useEffect } from 'react';

export interface Ticket {
  ticketId: string;
  title: string;
  category: string | null;
  date: string;
  status: 'submitted' | 'in-progress' | 'resolved' | 'critical';
  assignee?: { name: string; avatar?: string; fallback: string };
  priority?: string;
}

interface UseTicketsResult {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTickets(): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/tickets', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTickets(Array.isArray(data) ? data : data.tickets ?? []);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load tickets');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { tickets, loading, error, refetch: () => setTick((t) => t + 1) };
}
