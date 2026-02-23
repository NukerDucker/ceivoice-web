"use client";

import React, { useState } from "react";
import { Header as AdminDashboardHeader } from "@/components/layout/Navbar";
import { DASHBOARD_ASSIGNEES, DASHBOARD_TICKETS } from "@/lib/admin-dashboard-data";
import type { DashboardAssignee, DashboardTicket } from "@/lib/admin-dashboard-data";
import {
  STATUS_STYLE,
  getCatStyle,
  timeAgo,
  totalTickets,
  draftTickets,
  activeTickets,
  resolvedTickets,
  criticalTickets,
  categoryData,
  weeklyData,
} from "@/lib/admin-dashboard-utils";

function StatCard({ label, value, sub, subColor, bgColor }: {
  label: string;
  value: string | number;
  sub: string;
  subColor: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bgColor }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

function Avatar({ user }: { user: DashboardAssignee }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
      {user.fallback}
    </div>
  );
}

function DonutChart() {
  const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;
  let off = 0;
  const slices = categoryData.map((d) => {
    const dash = (d.pct / 100) * circ;
    const s = { ...d, dash, gap: circ - dash, offset: off };
    off += dash;
    return s;
  });

  return (
    <div className="flex flex-col items-center w-full">
      <svg width={180} height={180} viewBox="0 0 180 180">
        {slices.map((s, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={28}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ * 0.25}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: "#0f172a" }}>
          {totalTickets.toLocaleString()}
        </text>
      </svg>
      <div className="w-full mt-4 space-y-2">
        {categoryData.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
              <span className="text-slate-700">{d.label}</span>
            </div>
            <span className="font-semibold text-slate-900">{d.value} ({d.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart() {
  const maxVal = Math.max(...weeklyData.map((d) => d.value), 1);
  const maxH = 140;
  const colors = ["#fde68a", "#bfdbfe", "#ddd6fe", "#a7f3d0"];

  return (
    <div className="flex items-end justify-between gap-4 mt-6" style={{ height: maxH + 60 }}>
      {weeklyData.map((d, i) => {
        const h = Math.max(20, Math.round((d.value / maxVal) * maxH));
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ height: h, background: colors[i % colors.length] }}
            />
            <p className="text-lg font-bold text-slate-900 mt-2">{d.value}</p>
            <p className="text-xs text-slate-500">{d.week}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("30D");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Scrollable area — header is now INSIDE here */}
      <div className="flex-1 overflow-y-auto bg-slate-50">

        {/* Header scrolls with content */}
        <AdminDashboardHeader />

          <div className="px-8 py-6 space-y-5">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Draft Queue" value={draftTickets.length} sub="Need Reviews" subColor="#ef4444" bgColor="#fef3c2" />
              <StatCard label="Active Tickets" value={activeTickets.length} sub="In Progress" subColor="#6366f1" bgColor="#dbeafe" />
              <StatCard label="Avg Resolution" value={resolvedTickets.length > 0 ? "4.2h" : "—"} sub="↓ 15-21% faster" subColor="#10b981" bgColor="#e9d5ff" />
              <StatCard label="Active Assignees" value={DASHBOARD_ASSIGNEES.length} sub="Team Members" subColor="#64748b" bgColor="#ccfbf1" />
            </div>

            {/* ── Draft Queue ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Draft Queue - Action Required</h3>
                    <p className="text-xs text-slate-500">All submitted tickets pending admin review and approval</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  View All Draft
                </button>
              </div>

              {draftTickets.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No pending submissions.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {draftTickets.map((t: DashboardTicket) => {
                    const cs = getCatStyle(t.category);
                    return (
                      <div key={t.ticketId} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar user={t.assignee} />
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{t.assignee.name.toLowerCase().replace(' ', '.')}@example.com</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{timeAgo(t.date)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <h4 className="text-sm font-semibold text-slate-900 max-w-md truncate">{t.title}</h4>
                          <span
                            className="text-[10px] font-bold px-3 py-1 rounded-full uppercase"
                            style={{ background: cs.bg, color: cs.color }}
                          >
                            {t.category}
                          </span>
                          <button className="text-sm px-4 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium">
                            Edit
                          </button>
                          <button className="text-sm px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium">
                            Submit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 via-blue-400 to-purple-400 rounded-full"></div>
                    <span className="text-base font-bold text-slate-900">Ticket Volume Over time</span>
                  </div>
                  <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                    {(["7D", "30D", "90D"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                        style={{
                          background: range === r ? "#fff" : "transparent",
                          color: range === r ? "#0f172a" : "#64748b",
                          boxShadow: range === r ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChart />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Category & Status Breakdown</h3>
                    <p className="text-xs text-slate-500 mt-1">Distributed by category and current status</p>
                  </div>
                </div>
                <DonutChart />
              </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Assignee Management */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Assignee Management</h3>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Manage User →
                  </button>
                </div>
                <div className="space-y-3">
                  {DASHBOARD_ASSIGNEES.map((a: DashboardAssignee, i: number) => {
                    const userTickets = DASHBOARD_TICKETS.filter((t) => t.assignee.name === a.name);
                    const hasCritical = userTickets.some((t) => t.status === "critical");
                    const hasActive = userTickets.some((t) => t.status === "in-progress");
                    const statusLabel = hasCritical ? "CRITICAL" : hasActive ? "ACTIVE" : "IDLE";
                    const statusStyle = hasCritical
                      ? { bg: "#fee2e2", color: "#b91c1c" }
                      : hasActive
                      ? { bg: "#dcfce7", color: "#15803d" }
                      : { bg: "#f3f4f6", color: "#6b7280" };
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200">
                        <Avatar user={a} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">{a.role}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">{a.department}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusLabel}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {userTickets.length} ticket{userTickets.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Workload Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Active Workload Overview</h3>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "New", value: draftTickets.length, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "In Progress", value: activeTickets.length, color: "#6366f1", bg: "#eef2ff" },
                    { label: "Critical", value: criticalTickets.length, color: "#ef4444", bg: "#fef2f2" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 text-center border border-slate-200" style={{ background: s.bg }}>
                      <p className="text-3xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {DASHBOARD_TICKETS.filter((t) => t.status !== "resolved")
                    .slice(0, 4)
                    .map((t: DashboardTicket) => {
                      const st = STATUS_STYLE[t.status];
                      return (
                        <div key={t.ticketId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                          <Avatar user={t.assignee} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                            <p className="text-xs text-slate-500">{t.ticketId}</p>
                          </div>
                          <span
                            className="text-[10px] font-bold px-3 py-1 rounded-full shrink-0"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
}