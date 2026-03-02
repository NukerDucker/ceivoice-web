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
    async function load() {
      setLoading(true);
      try {
        const r = await fetch('/api/tickets', { credentials: 'include' });
        const data: unknown = await r.json();
        if (!cancelled) {
          setTickets(Array.isArray(data) ? (data as Ticket[]) : ((data as { tickets?: Ticket[] }).tickets ?? []));
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [tick]);

  return { tickets, loading, error, refetch: () => setTick((t) => t + 1) };
}
