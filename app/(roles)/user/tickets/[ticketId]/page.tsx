'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { Button } from '@/components/ui/button';
import type { ApiTicket, ApiUser, ApiComment } from '@/types/api';

interface ApiFollower {
  ticket_id: number;
  user_id: string;
  user: ApiUser;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Draft:    { label: 'Draft',       color: 'text-gray-500 bg-gray-100'    },
  New:      { label: 'Submitted',   color: 'text-blue-600 bg-blue-50'     },
  Assigned: { label: 'In Progress', color: 'text-orange-600 bg-orange-50' },
  Solving:  { label: 'In Progress', color: 'text-orange-600 bg-orange-50' },
  Solved:   { label: 'Resolved',    color: 'text-green-600 bg-green-50'   },
  Failed:   { label: 'Escalated',   color: 'text-red-600 bg-red-50'       },
  Renew:    { label: 'In Review',   color: 'text-yellow-600 bg-yellow-50' },
};

function displayName(u: ApiUser | null | undefined): string {
  return u?.full_name ?? u?.user_name ?? u?.email ?? 'Unknown';
}

function initial(u: ApiUser | null | undefined): string {
  return displayName(u).charAt(0).toUpperCase();
}

export default function UserTicketDetailPage() {
  const params    = useParams();
  const ticketId  = params.ticketId as string;

  const [ticket,   setTicket]   = useState<ApiTicket | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [followers, setFollowers] = useState<ApiFollower[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [commentText,  setCommentText]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const fetchComments = () =>
    apiFetch<ApiComment[]>(`/tickets/id/${ticketId}/comments?public=true`);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiTicket>(`/tickets/id/${ticketId}`),
      fetchComments(),
      apiFetch<ApiFollower[]>(`/tickets/id/${ticketId}/followers`),
    ])
      .then(([t, c, f]) => { setTicket(t); setComments(c); setFollowers(f); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load ticket'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch(`/tickets/id/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim(), is_internal: false }),
      });
      setCommentText('');
      setComments(await fetchComments());
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 px-10 pt-6">
        <p className="text-red-600 text-sm">{error ?? 'Ticket not found.'}</p>
        <Link href="/user/my-request" className="text-sm text-blue-600 underline mt-2 block">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const statusName = ticket.status?.name ?? 'Draft';
  const statusCfg  = STATUS_CONFIG[statusName] ?? STATUS_CONFIG.Draft;

  return (
    <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
      <Link href="/user/my-request" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← My Tickets
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Ticket header */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  TD-{String(ticket.ticket_id).padStart(6, '0')}
                  {ticket.category?.name ? ` · ${ticket.category.name}` : ''}
                </p>
                <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shrink-0 ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            {ticket.summary && (
              <div className="mt-4 border-t pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Summary</p>
                <MarkdownContent content={ticket.summary} />
              </div>
            )}

            {ticket.suggested_solution && (
              <div className="mt-4 border-t pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Suggested Solution</p>
                <MarkdownContent content={ticket.suggested_solution} />
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
              Submitted {new Date(ticket.created_at).toLocaleDateString()}
              {' · '}Updated {new Date(ticket.updated_at).toLocaleDateString()}
            </p>
          </div>

          {/* EP05-ST001: Public comments (chronological) */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Public Updates
              {comments.length > 0 && (
                <span className="ml-1.5 text-gray-400 font-normal">({comments.length})</span>
              )}
            </h2>

            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No updates yet.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map((c) => (
                  <div key={c.comment_id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-semibold">
                        {(c.user?.full_name ?? c.user?.user_name ?? 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {c.user?.full_name ?? c.user?.user_name ?? 'Support Team'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <MarkdownContent content={c.content} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EP05-ST002: Reply box — public only for users */}
            <div className="border-t pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Add a comment</p>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your reply…"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {submitError && <p className="text-xs text-red-600 mt-1">{submitError}</p>}
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  size="sm"
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* EP05-ST003: People sidebar */}
        <div>
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">People</h2>
            <div className="space-y-4">

              {ticket.creator && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Creator</p>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-[11px] font-semibold">{initial(ticket.creator)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{displayName(ticket.creator)}</p>
                      <p className="text-[10px] text-gray-400 truncate">{ticket.creator.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Assignee</p>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 text-[11px] font-semibold">{initial(ticket.assignee)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{displayName(ticket.assignee)}</p>
                      <p className="text-[10px] text-gray-400 truncate">{ticket.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Unassigned</p>
                )}
              </div>

              {followers.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                    Followers ({followers.length})
                  </p>
                  <div className="space-y-1.5">
                    {followers.map((f) => (
                      <div key={f.user_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-purple-600 text-[11px] font-semibold">{initial(f.user)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{displayName(f.user)}</p>
                          <p className="text-[10px] text-gray-400 truncate">{f.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
