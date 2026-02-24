'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/ReviewTicketTB';
import {
  DASHBOARD_ASSIGNEES,
  DASHBOARD_TICKETS,
  AI_SUGGESTIONS,
  ORIGINAL_MESSAGES,
} from '@/lib/admin-dashboard-data';
import type { DashboardAssignee, DashboardTicket } from '@/lib/admin-dashboard-data';

// ─── Local Type Aliases ───────────────────────────────────────────────────────

type Assignee = DashboardAssignee;
type TicketItem = DashboardTicket;

// ─── Form / UI-only Types ─────────────────────────────────────────────────────

interface FormValues {
  title?: string;
  category?: string;
  summary?: string;
  solution?: string;
  assigneeIdx?: number;
  deadline?: string;
  deadlineTime?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 bg-gray-50 outline-none font-sans';
const textareaClass = `${inputClass} resize-y leading-relaxed`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DraftTicketPage() {
  const router = useRouter();
  const selectedId = 'TD-001238';
  const [form, setForm] = useState<Record<string, FormValues>>({});

  // ─── Button States ────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const currentTicket = DASHBOARD_TICKETS.find((t) => t.ticketId === selectedId) ?? null;
  const ai = AI_SUGGESTIONS[selectedId] ?? Object.values(AI_SUGGESTIONS)[0];
  const original = ORIGINAL_MESSAGES[selectedId] ?? Object.values(ORIGINAL_MESSAGES)[0];

  function getField<K extends keyof FormValues>(key: K, fallback: FormValues[K]): FormValues[K] {
    const val = form[selectedId]?.[key];
    return val !== undefined ? val : fallback;
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((f) => ({ ...f, [selectedId]: { ...(f[selectedId] ?? {}), [key]: value } }));
  }

  const titleVal = getField('title', currentTicket?.title ?? '') as string;
  const categoryVal = getField('category', ai.category) as string;
  const summaryVal = getField('summary', ai.summary) as string;
  const solutionVal = getField('solution', ai.suggestedSolution) as string;
  const assigneeIdxVal = getField('assigneeIdx', 0) as number;
  const deadlineVal = getField('deadline', ai.deadline) as string;
  const deadlineTimeVal = getField('deadlineTime', ai.deadlineTime) as string;

  // ─── Collect current form data ────────────────────────────────────────────
  function getPayload() {
    return {
      ticketId: selectedId,
      title: titleVal,
      category: categoryVal,
      summary: summaryVal,
      solution: solutionVal,
      assignee: DASHBOARD_ASSIGNEES[assigneeIdxVal]?.name ?? null,
      deadline: deadlineVal ? `${deadlineVal}T${deadlineTimeVal || '00:00'}` : null,
    };
  }

  // ─── Save Draft Handler ───────────────────────────────────────────────────
  // NOTE: Currently simulated — replace inside the try block with a real
  // fetch() call once your backend API is ready.
  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    try {
      console.log('Draft payload:', getPayload());
      await new Promise((res) => setTimeout(res, 800));

      // ── Uncomment when backend is ready ──
      // const res = await fetch(`/api/tickets/draft/${selectedId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(getPayload()),
      // });
      // if (!res.ok) throw new Error('Failed to save');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  // ─── Submit as New Ticket Handler ─────────────────────────────────────────
  // TODO: Replace '/api/tickets' with your actual API endpoint
  // TODO: Replace '/tickets' with the page you want to redirect to after submit
  const handleSubmit = async () => {
    setSubmitStatus('submitting');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...getPayload(), status: 'open' }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      router.push('/tickets');
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 2500);
    }
  };

  const subtitle = currentTicket
    ? `Draft ${currentTicket.ticketId} · created ${timeAgo(currentTicket.date)}`
    : undefined;

  return (
    <div className="flex h-screen font-sans bg-gray-100 text-gray-900 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="flex flex-col h-screen shrink-0">
        <Sidebar
          userRole="admin"
          userName="Palm Pollapat"
        />
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <Header
          title="Review and Edit Draft Ticket"
          subtitle={subtitle}
        />

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-5">

          {/* Original Request */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5 rounded-t-xl">
              <span className="text-base">✉️</span>
              <span className="text-[13.5px] font-semibold text-gray-700">Original request</span>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5">
                From: {original.from}
              </div>
              <div className="text-[13.5px] leading-7 text-gray-700 whitespace-pre-wrap">
                {original.body}
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
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
                  onChange={(e) => setField('title', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Category">
                <input
                  value={categoryVal}
                  onChange={(e) => setField('category', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Summary">
                <textarea
                  value={summaryVal}
                  onChange={(e) => setField('summary', e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <Field label="Suggested Solution">
                <textarea
                  value={solutionVal}
                  onChange={(e) => setField('solution', e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <Field label="Assignee">
                <div className="flex flex-wrap gap-2 p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  {DASHBOARD_ASSIGNEES.map((a, i) => (
                    <button
                      key={a.name}
                      onClick={() => setField('assigneeIdx', i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                        assigneeIdxVal === i
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <img src={a.avatar} alt={a.name} className="w-4 h-4 rounded-full" />
                      {a.fallback}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Deadline">
                <div className="flex gap-2.5">
                  <input
                    type="date"
                    value={deadlineVal}
                    onChange={(e) => setField('deadline', e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="time"
                    value={deadlineTimeVal}
                    onChange={(e) => setField('deadlineTime', e.target.value)}
                    className={`${inputClass} w-28 shrink-0`}
                  />
                </div>
              </Field>

              {/* ── Status Messages ── */}
              {(saveStatus === 'saved' || saveStatus === 'error' || submitStatus === 'error') && (
                <div className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  saveStatus === 'error' || submitStatus === 'error'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {saveStatus === 'saved' && '✅ Draft saved successfully!'}
                  {saveStatus === 'error' && '❌ Failed to save draft. Please try again.'}
                  {submitStatus === 'error' && '❌ Failed to submit ticket. Please try again.'}
                </div>
              )}

              {/* ── Action Buttons ── */}
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
                  {submitStatus === 'submitting' ? 'Submitting...' : 'Submit as New Ticket'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}