'use client';

import React, { Suspense, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Header } from '@/components/layout/ReviewTicketTB';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import TicketDetailPage from '@/components/tickets/TicketDetailPage';
import type { ApiUser, ApiCategory } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTicket {
  ticket_id: number;
  title: string | null;
  summary: string | null;
  suggested_solution: string | null;
  priority: string | null;
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

const inputClass    = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 bg-gray-50 outline-none font-sans';
const textareaClass = `${inputClass} resize-y leading-relaxed`;

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

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({
  title, emoji, badge, headerBg, headerBorder, headerTextColor, children, defaultOpen = true,
}: {
  title: string; emoji: string; badge?: React.ReactNode;
  headerBg: string; headerBorder: string; headerTextColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 ${headerBg} border-b ${headerBorder} flex items-center gap-2.5 rounded-t-xl`}
      >
        <span className="text-base">{emoji}</span>
        <span className={`text-[13.5px] font-semibold ${headerTextColor}`}>{title}</span>
        {badge && <span className="flex items-center gap-2">{badge}</span>}
        <svg
          className={`w-4 h-4 ml-auto text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="flex-1">{children}</div>}
    </div>
  );
}

// ─── Draft Review Form ────────────────────────────────────────────────────────

function DraftReviewForm({
  ticketId,
  ticket: initialTicket,
  assignees,
  categories,
}: {
  ticketId: string;
  ticket: ApiTicket;
  assignees: ApiAssignee[];
  categories: ApiCategory[];
}) {
  const router = useRouter();

  const [ticket,          setTicket]          = useState<ApiTicket>(initialTicket);
  const [titleVal,        setTitleVal]        = useState(initialTicket.title ?? '');
  const [categoryId,      setCategoryId]      = useState<number | null>(
    initialTicket.category?.category_id ?? (categories[0]?.category_id ?? null)
  );
  const [summaryVal,      setSummaryVal]      = useState(initialTicket.summary ?? '');
  const [solutionVal,     setSolutionVal]     = useState(initialTicket.suggested_solution ?? '');
  const [assigneeId,      setAssigneeId]      = useState<string>(
    initialTicket.assignee?.user_id ?? (assignees[0]?.user_id ?? '')
  );
  const [priorityVal,     setPriorityVal]     = useState(initialTicket.priority ?? '');
  const [deadlineVal,     setDeadlineVal]     = useState(() =>
    initialTicket.deadline ? new Date(initialTicket.deadline).toISOString().slice(0, 10) : ''
  );
  const [deadlineTimeVal, setDeadlineTimeVal] = useState(() =>
    initialTicket.deadline ? new Date(initialTicket.deadline).toISOString().slice(11, 16) : ''
  );
  const [saveStatus,     setSaveStatus]     = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitStatus,   setSubmitStatus]   = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [unlinkingId,    setUnlinkingId]    = useState<number | null>(null);
  const [selectedReqIdx, setSelectedReqIdx] = useState(0);

  const linkedRequests = ticket.ticket_requests
    .map((tr) => tr.request)
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const activeRequest = linkedRequests[selectedReqIdx] ?? null;
  const canUnlink     = linkedRequests.length > 1;

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    try {
      const deadline = deadlineVal ? `${deadlineVal}T${deadlineTimeVal || '00:00'}:00.000Z` : null;
      await apiFetch(`/admin/drafts/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: titleVal,
          summary: summaryVal,
          suggested_solution: solutionVal,
          ...(categoryId  ? { category_id: categoryId }      : {}),
          ...(assigneeId  ? { assignee_user_id: assigneeId } : {}),
          ...(deadline    ? { deadline }                     : {}),
          ...(priorityVal ? { priority: priorityVal }        : {}),
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const handleApprove = async () => {
    setSubmitStatus('submitting');
    try {
      await apiFetch(`/admin/drafts/${ticketId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ ...(assigneeId ? { assignee_user_id: assigneeId } : {}) }),
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
      await apiFetch(`/admin/tickets/${ticketId}/requests/${requestId}`, { method: 'DELETE' });
      const refreshed = await apiFetch<ApiTicket>(`/tickets/id/${ticketId}`);
      setTicket(refreshed);
      setSelectedReqIdx(0);
    } catch {
      // local state stays; next load will correct
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <>
      <Header
        title="Review and Edit Draft Ticket"
        subtitle={`Draft #${ticket.ticket_id} · created ${timeAgo(ticket.created_at)}`}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4">

        {/* ── Back button ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm font-medium w-fit transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* ── Original Request ── */}
        <Panel
          title="Original request" emoji="✉️"
          headerBg="bg-gray-50" headerBorder="border-gray-200" headerTextColor="text-gray-700"
          badge={
            linkedRequests.length > 0 ? (
              <span className="text-[10.5px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                {linkedRequests.length} linked
              </span>
            ) : undefined
          }
        >
          {/* Tab switcher for multiple linked requests */}
          {linkedRequests.length > 1 && (
            <div className="flex gap-1 px-4 pt-3 pb-2 flex-wrap border-b border-gray-100">
              {linkedRequests.map((r, i) => (
                <button
                  key={r.request_id}
                  onClick={() => setSelectedReqIdx(i)}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                    selectedReqIdx === i ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                <p className="text-[13.5px] text-gray-700"><span className="font-semibold">Title:</span> {ticket.title}</p>
                <p className="text-[13.5px] text-gray-700"><span className="font-semibold">Category:</span> {ticket.category?.name ?? '—'}</p>
                <p className="text-[13.5px] text-gray-700"><span className="font-semibold">Assignee:</span> {ticket.assignee?.full_name ?? '—'}</p>
                <p className="text-[13.5px] text-gray-500 italic mt-2">No original message on record for this ticket.</p>
              </div>
            )}
          </div>
        </Panel>

        {/* ── AI Suggestion ── */}
        <Panel
          title="AI suggestion" emoji="🤖"
          headerBg="bg-sky-50" headerBorder="border-sky-200" headerTextColor="text-sky-700"
          badge={
            <span className="text-[10.5px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-semibold">
              Auto-generated
            </span>
          }
        >
          <div className="p-4 flex flex-col gap-3 overflow-hidden">

            {/* Title */}
            <Field label="Title">
              <input value={titleVal} onChange={(e) => setTitleVal(e.target.value)} className={inputClass} />
            </Field>

            {/* Category + Assignee + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Category">
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Assignee">
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Unassigned —</option>
                  {assignees.map((a) => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.full_name ?? a.user_name ?? a.email}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={priorityVal}
                  onChange={(e) => setPriorityVal(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Select —</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </Field>
            </div>

            {/* Summary + Suggested Solution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Summary">
                <textarea value={summaryVal} onChange={(e) => setSummaryVal(e.target.value)} rows={3} className={textareaClass} />
              </Field>
              <Field label="Suggested Solution">
                <textarea value={solutionVal} onChange={(e) => setSolutionVal(e.target.value)} rows={3} className={textareaClass} />
              </Field>
            </div>

            {/* Deadline */}
            <Field label="Deadline">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input type="date" value={deadlineVal} onChange={(e) => setDeadlineVal(e.target.value)} className={inputClass} />
                <input type="time" value={deadlineTimeVal} onChange={(e) => setDeadlineTimeVal(e.target.value)} className={`${inputClass} w-36`} />
              </div>
            </Field>

            {/* Status feedback */}
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveDraft}
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-full text-[12.5px] font-semibold border-[1.5px] border-amber-300 bg-amber-50 text-amber-600 transition-opacity ${
                  saveStatus === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-amber-100 cursor-pointer'
                }`}
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleApprove}
                disabled={submitStatus === 'submitting'}
                className={`px-4 py-2 rounded-full text-[12.5px] font-bold border-[1.5px] border-green-300 bg-green-50 text-green-700 transition-opacity ${
                  submitStatus === 'submitting' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-100 cursor-pointer'
                }`}
              >
                {submitStatus === 'submitting' ? 'Approving...' : 'Approve as New Ticket'}
              </button>
            </div>

          </div>
        </Panel>

      </div>
    </>
  );
}

// ─── Status-aware wrapper ─────────────────────────────────────────────────────

type LoadState =
  | { phase: 'loading' }
  | { phase: 'not-found' }
  | { phase: 'draft'; ticket: ApiTicket; assignees: ApiAssignee[]; categories: ApiCategory[] }
  | { phase: 'other' };

function UnifiedTicketPage({ ticketId }: { ticketId: string }) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<ApiTicket>(`/tickets/id/${ticketId}`),
      apiFetch<ApiAssignee[]>('/admin/assignees'),
      apiFetch<ApiCategory[]>('/admin/categories'),
    ])
      .then(([ticket, assignees, categories]) => {
        if (cancelled) return;
        if (ticket.status?.name === 'Draft') {
          setState({ phase: 'draft', ticket, assignees, categories });
        } else {
          setState({ phase: 'other' });
        }
      })
      .catch(() => { if (!cancelled) setState({ phase: 'not-found' }); });
    return () => { cancelled = true; };
  }, [ticketId]);

  if (state.phase === 'loading') {
    return <div className="flex h-full items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  if (state.phase === 'not-found') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-lg font-semibold text-gray-700">Ticket not found</p>
        <p className="text-sm">No ticket with ID <span className="font-mono text-gray-600">#{ticketId}</span> exists.</p>
      </div>
    );
  }

  if (state.phase === 'draft') {
    return (
      <div className="flex h-full flex-col font-sans bg-gray-100 text-gray-900 overflow-hidden">
        <DraftReviewForm
          ticketId={ticketId}
          ticket={state.ticket}
          assignees={state.assignees}
          categories={state.categories}
        />
      </div>
    );
  }

  return <TicketDetailPage ticketId={ticketId} />;
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-gray-400 text-sm">Loading…</div>}>
      <UnifiedTicketPage ticketId={ticketId} />
    </Suspense>
  );
}