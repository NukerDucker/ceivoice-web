'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/ReviewTicketTB';
import { apiFetch } from '@/lib/api-client';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import type { ApiUser, ApiCategory } from '@/types/api';

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiTicket {
  ticket_id: number;
  title: string | null;
  summary: string | null;
  suggested_solution: string | null;
  deadline: string | null;
  created_at: string;
  category: { category_id: number; name: string } | null;
  status: { name: string } | null;
  assignee: ApiUser | null;
  ticket_requests: Array<{
    request: {
      request_id: number;
      email: string;
      message: string | null;
      tracking_id: string;
    } | null;
  }>;
}

type ApiAssignee = ApiUser & { assigned_tickets?: unknown[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function assigneeName(a: ApiAssignee): string {
  return a.full_name ?? a.user_name ?? a.email;
}

function assigneeFallback(a: ApiAssignee): string {
  const name = assigneeName(a);
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass    = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 bg-gray-50 outline-none font-sans';
const textareaClass = `${inputClass} resize-y leading-relaxed`;

// ─── Not-found screen ─────────────────────────────────────────────────────────

function NotFound({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
      <p className="text-lg font-semibold text-gray-700">Ticket not found</p>
      <p className="text-sm">
        No ticket with ID <span className="font-mono text-gray-600">#{id}</span> exists.
      </p>
      <button
        onClick={() => router.back()}
        className="mt-2 px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
      >
        ← Go back
      </button>
    </div>
  );
}

// ─── Panel component ──────────────────────────────────────────────────────────

/**
 * On mobile: collapsible accordion panel.
 * On sm+: always-open panel (the toggle is hidden).
 */
function Panel({
  title,
  emoji,
  badge,
  headerBg,
  headerBorder,
  headerTextColor,
  children,
  defaultOpen = true,
}: {
  title: string;
  emoji: string;
  badge?: React.ReactNode;
  headerBg: string;
  headerBorder: string;
  headerTextColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
      {/* Header — tapping toggles on mobile, static on desktop */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 ${headerBg} border-b ${headerBorder} flex items-center gap-2.5 rounded-t-xl sm:cursor-default`}
      >
        <span className="text-base">{emoji}</span>
        <span className={`text-[13.5px] font-semibold ${headerTextColor}`}>{title}</span>
        {badge && <span className="ml-auto flex items-center gap-2">{badge}</span>}
        {/* Chevron only visible on mobile */}
        <svg
          className={`w-4 h-4 ml-auto sm:hidden text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content — always visible on sm+, toggleable on mobile */}
      <div className={`flex-1 overflow-y-auto ${open ? 'block' : 'hidden'} sm:block`}>
        {children}
      </div>
    </div>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function ReviewTicketInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const selectedId   = searchParams.get('id') ?? '';

  const [ticket,     setTicket]     = useState<ApiTicket | null>(null);
  const [assignees,  setAssignees]  = useState<ApiAssignee[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  const [titleVal,        setTitleVal]        = useState('');
  const [categoryId,      setCategoryId]      = useState<number | null>(null);
  const [summaryVal,      setSummaryVal]      = useState('');
  const [solutionVal,     setSolutionVal]     = useState('');
  const [assigneeId,      setAssigneeId]      = useState<string>('');
  const [deadlineVal,     setDeadlineVal]     = useState('');
  const [deadlineTimeVal, setDeadlineTimeVal] = useState('');

  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving'     | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting'  | 'done'  | 'error'>('idle');
  const [unlinkingId,  setUnlinkingId]  = useState<number | null>(null);
  const [selectedReqIdx, setSelectedReqIdx] = useState(0);

  useEffect(() => {
    if (!selectedId) {
      Promise.resolve().then(() => { setLoading(false); setNotFound(true); });
      return;
    }

    let cancelled = false;

    Promise.all([
      apiFetch<ApiTicket>(`/tickets/id/${selectedId}`),
      apiFetch<ApiAssignee[]>('/admin/assignees'),
      apiFetch<ApiCategory[]>('/admin/categories'),
    ])
      .then(([t, a, cats]) => {
        if (cancelled) return;
        setTicket(t);
        setAssignees(a);
        setCategories(cats);
        setTitleVal(t.title ?? '');
        setCategoryId(t.category?.category_id ?? (cats[0]?.category_id ?? null));
        setSummaryVal(t.summary ?? '');
        setSolutionVal(t.suggested_solution ?? '');
        setAssigneeId(t.assignee?.user_id ?? (a[0]?.user_id ?? ''));
        if (t.deadline) {
          const d = new Date(t.deadline);
          setDeadlineVal(d.toISOString().slice(0, 10));
          setDeadlineTimeVal(d.toISOString().slice(11, 16));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    try {
      const deadline = deadlineVal
        ? `${deadlineVal}T${deadlineTimeVal || '00:00'}:00.000Z`
        : null;
      await apiFetch(`/admin/drafts/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: titleVal,
          summary: summaryVal,
          suggested_solution: solutionVal,
          ...(categoryId ? { category_id: categoryId } : {}),
          ...(assigneeId ? { assignee_user_id: assigneeId } : {}),
          ...(deadline ? { deadline } : {}),
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const handleSubmit = async () => {
    setSubmitStatus('submitting');
    try {
      await apiFetch(`/admin/drafts/${selectedId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          ...(assigneeId ? { assignee_user_id: assigneeId } : {}),
        }),
      });
      setSubmitStatus('done');
      router.push('/admin/tickets');
    } catch {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 2500);
    }
  };

  const handleUnlink = async (requestId: number) => {
    setUnlinkingId(requestId);
    try {
      await apiFetch(`/admin/tickets/${selectedId}/requests/${requestId}`, { method: 'DELETE' });
      const t = await apiFetch<ApiTicket>(`/tickets/id/${selectedId}`);
      setTicket(t);
      setSelectedReqIdx(0);
    } catch {
      // reset on error
    } finally {
      setUnlinkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-400 text-sm">
        Loading ticket…
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="flex h-screen font-sans bg-gray-100 text-gray-900 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header title="Review and Edit Draft Ticket" />
          <NotFound id={selectedId || '(none)'} />
        </main>
      </div>
    );
  }

  const linkedRequests = ticket.ticket_requests
    .map((tr) => tr.request)
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const activeRequest = linkedRequests[selectedReqIdx] ?? null;
  const canUnlink     = linkedRequests.length > 1;
  const subtitle      = `Draft #${ticket.ticket_id} · created ${timeAgo(ticket.created_at)}`;

  return (
    <div className="flex h-screen font-sans bg-gray-100 text-gray-900 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={ticket.status?.name === 'Draft' ? 'Review and Edit Draft Ticket' : `Edit Ticket (${ticket.status?.name})`}
          subtitle={subtitle}
        />

        {/*
          Layout:
          - Mobile:  single column, stacked panels (scrollable)
          - Desktop: two-column side-by-side grid
        */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 auto-rows-min sm:auto-rows-fr">

          {/* ── Original Request panel ── */}
          <Panel
            title="Original request"
            emoji="✉️"
            headerBg="bg-gray-50"
            headerBorder="border-gray-200"
            headerTextColor="text-gray-700"
            defaultOpen={true}
            badge={
              linkedRequests.length > 0 ? (
                <span className="text-[10.5px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                  {linkedRequests.length} linked
                </span>
              ) : undefined
            }
          >
            {/* Request tabs */}
            {linkedRequests.length > 1 && (
              <div className="flex gap-1 px-4 pt-3 pb-2 flex-wrap border-b border-gray-100">
                {linkedRequests.map((r, i) => (
                  <button
                    key={r.request_id}
                    onClick={() => setSelectedReqIdx(i)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                      selectedReqIdx === i
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    #{r.request_id}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 sm:p-5">
              {activeRequest ? (
                <>
                  <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                      From: {activeRequest.email}
                    </div>
                    {canUnlink && (
                      <button
                        onClick={() => handleUnlink(activeRequest.request_id)}
                        disabled={unlinkingId === activeRequest.request_id}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border border-red-200 transition-colors ${
                          unlinkingId === activeRequest.request_id
                            ? 'opacity-50 cursor-not-allowed bg-red-50 text-red-400'
                            : 'bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer'
                        }`}
                      >
                        {unlinkingId === activeRequest.request_id ? 'Unlinking…' : '✕ Unlink'}
                      </button>
                    )}
                  </div>
                  <MarkdownContent content={activeRequest.message ?? '(No message body)'} />
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Ticket details
                  </div>
                  <p className="text-[13.5px] text-gray-700">
                    <span className="font-semibold">Title:</span> {ticket.title}
                  </p>
                  <p className="text-[13.5px] text-gray-700">
                    <span className="font-semibold">Category:</span> {ticket.category?.name ?? '—'}
                  </p>
                  <p className="text-[13.5px] text-gray-700">
                    <span className="font-semibold">Assignee:</span> {ticket.assignee?.full_name ?? '—'}
                  </p>
                  <p className="text-[13.5px] text-gray-500 italic mt-2">
                    No original message on record for this ticket.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          {/* ── AI Suggestion / Edit Form panel ── */}
          <Panel
            title="AI suggestion"
            emoji="🤖"
            headerBg="bg-sky-50"
            headerBorder="border-sky-200"
            headerTextColor="text-sky-700"
            defaultOpen={false}
            badge={
              <span className="text-[10.5px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-semibold">
                Auto-generated
              </span>
            }
          >
            <div className="p-4 sm:p-5 flex flex-col gap-3.5">

              <Field label="Title">
                <input
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Category">
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Summary">
                <textarea
                  value={summaryVal}
                  onChange={(e) => setSummaryVal(e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <Field label="Suggested Solution">
                <textarea
                  value={solutionVal}
                  onChange={(e) => setSolutionVal(e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <Field label="Assignee">
                <div className="flex flex-wrap gap-2 p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  {assignees.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No assignees available</span>
                  ) : (
                    assignees.map((a) => (
                      <button
                        key={a.user_id}
                        onClick={() => setAssigneeId(a.user_id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                          assigneeId === a.user_id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[9px] font-bold flex items-center justify-center">
                          {assigneeFallback(a)}
                        </span>
                        {assigneeName(a)}
                      </button>
                    ))
                  )}
                </div>
              </Field>

              <Field label="Deadline">
                {/* Stack date + time vertically on mobile, side by side on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                  <input
                    type="date"
                    value={deadlineVal}
                    onChange={(e) => setDeadlineVal(e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="time"
                    value={deadlineTimeVal}
                    onChange={(e) => setDeadlineTimeVal(e.target.value)}
                    className={`${inputClass} sm:w-28 sm:shrink-0`}
                  />
                </div>
              </Field>

              {(saveStatus === 'saved' || saveStatus === 'error' || submitStatus === 'error') && (
                <div className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  saveStatus === 'error' || submitStatus === 'error'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {saveStatus   === 'saved' && '✅ Draft saved successfully!'}
                  {saveStatus   === 'error' && '❌ Failed to save draft. Please try again.'}
                  {submitStatus === 'error' && '❌ Failed to approve ticket. Please try again.'}
                </div>
              )}

              {/* Action buttons: full-width on mobile, auto on desktop */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  onClick={handleSaveDraft}
                  disabled={saveStatus === 'saving'}
                  className={`w-full sm:w-auto px-4 py-2 rounded-full text-[12.5px] font-semibold border-[1.5px] border-amber-300 bg-amber-50 text-amber-600 transition-opacity ${
                    saveStatus === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-amber-100 cursor-pointer'
                  }`}
                  title={ticket.status?.name === 'Draft' ? 'Save changes to draft' : 'Save changes to ticket'}
                >
                  {saveStatus === 'saving' ? 'Saving...' : (ticket.status?.name === 'Draft' ? 'Save Draft' : 'Update Ticket')}
                </button>
                {ticket.status?.name === 'Draft' && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitStatus === 'submitting'}
                    className={`w-full sm:w-auto px-4 py-2 rounded-full text-[12.5px] font-bold border-[1.5px] border-green-300 bg-green-50 text-green-700 transition-opacity ${
                      submitStatus === 'submitting' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-100 cursor-pointer'
                    }`}
                  >
                    {submitStatus === 'submitting' ? 'Approving...' : 'Approve as New Ticket'}
                  </button>
                )}
              </div>

            </div>
          </Panel>

        </div>
      </main>
    </div>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function ReviewTicketPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-400 text-sm">
        Loading ticket…
      </div>
    }>
      <ReviewTicketInner />
    </Suspense>
  );
}