'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/ReviewTicketTB';
import { apiFetch } from '@/lib/api-client';

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiUser {
  user_id: string;
  full_name: string | null;
  user_name: string | null;
  email: string;
}

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
      email: string;
      name: string | null;
      body: string | null;
      tracking_id: string;
    } | null;
  }>;
}

interface ApiAssignee {
  user_id: string;
  full_name: string | null;
  user_name: string | null;
  email: string;
  role: string;
  assigned_tickets?: unknown[];
}

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

// ─── Inner component ──────────────────────────────────────────────────────────

function ReviewTicketInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const selectedId   = searchParams.get('id') ?? '';

  // API state
  const [ticket,     setTicket]     = useState<ApiTicket | null>(null);
  const [assignees,  setAssignees]  = useState<ApiAssignee[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  // Form state
  const [titleVal,        setTitleVal]        = useState('');
  const [categoryVal,     setCategoryVal]     = useState('');
  const [summaryVal,      setSummaryVal]      = useState('');
  const [solutionVal,     setSolutionVal]     = useState('');
  const [assigneeId,      setAssigneeId]      = useState<string>('');
  const [deadlineVal,     setDeadlineVal]     = useState('');
  const [deadlineTimeVal, setDeadlineTimeVal] = useState('');

  // Action status
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving'    | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done'  | 'error'>('idle');

  useEffect(() => {
    if (!selectedId) { setLoading(false); setNotFound(true); return; }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch<ApiTicket>(`/api/tickets/${selectedId}`),
      apiFetch<ApiAssignee[]>('/api/admin/assignees'),
    ])
      .then(([t, a]) => {
        if (cancelled) return;
        setTicket(t);
        setAssignees(a);
        // Pre-fill form from API data
        setTitleVal(t.title ?? '');
        setCategoryVal(t.category?.name ?? '');
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
      await apiFetch(`/api/admin/drafts/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: titleVal,
          summary: summaryVal,
          suggested_solution: solutionVal,
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
      await apiFetch(`/api/admin/drafts/${selectedId}/approve`, { method: 'POST' });
      setSubmitStatus('done');
      router.push('/admin/tickets');
    } catch {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 2500);
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
        <Sidebar userRole="admin" userName="Admin" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header title="Review and Edit Draft Ticket" />
          <NotFound id={selectedId || '(none)'} />
        </main>
      </div>
    );
  }

  const request = ticket.ticket_requests[0]?.request ?? null;
  const subtitle = `Draft #${ticket.ticket_id} · created ${timeAgo(ticket.created_at)}`;

  return (
    <div className="flex h-screen font-sans bg-gray-100 text-gray-900 overflow-hidden">
      <div className="flex flex-col h-screen shrink-0">
        <Sidebar userRole="admin" userName="Admin" />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Review and Edit Draft Ticket" subtitle={subtitle} />

        <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-5">

          {/* Original Request */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5 rounded-t-xl">
              <span className="text-base">✉️</span>
              <span className="text-[13.5px] font-semibold text-gray-700">Original request</span>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {request ? (
                <>
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5">
                    From: {request.name ?? request.email}
                  </div>
                  <div className="text-[13.5px] leading-7 text-gray-700 whitespace-pre-wrap">
                    {request.body ?? '(No message body)'}
                  </div>
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
          </div>

          {/* AI Suggestion / Edit Form */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-sky-50 border-b border-sky-200 flex items-center gap-2.5 rounded-t-xl">
              <span className="text-base">🤖</span>
              <span className="text-[13.5px] font-semibold text-sky-700">AI suggestion</span>
              <span className="ml-auto text-[10.5px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-semibold">
                Auto-generated
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3.5">

              <Field label="Title">
                <input
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Category">
                <input
                  value={categoryVal}
                  onChange={(e) => setCategoryVal(e.target.value)}
                  className={inputClass}
                />
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
                <div className="flex gap-2.5">
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
                    className={`${inputClass} w-28 shrink-0`}
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

              <div className="flex gap-2 justify-end pt-1 flex-wrap">
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
                  onClick={handleSubmit}
                  disabled={submitStatus === 'submitting'}
                  className={`px-4 py-2 rounded-full text-[12.5px] font-bold border-[1.5px] border-green-300 bg-green-50 text-green-700 transition-opacity ${
                    submitStatus === 'submitting' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-100 cursor-pointer'
                  }`}
                >
                  {submitStatus === 'submitting' ? 'Approving...' : 'Approve as New Ticket'}
                </button>
              </div>

            </div>
          </div>

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
