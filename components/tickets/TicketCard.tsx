'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Pencil, ChevronDown, UserCircle } from 'lucide-react';

interface User {
  name: string;
  avatar?: string;
  fallback: string;
}

export interface Ticket {
  ticketId: string;
  title: string;
  category: string | null;
  date: Date;
  status: 'submitted' | 'in-progress' | 'resolved' | 'critical';
  assignee?: User;
  priority?: string;
}

interface TicketListProps {
  data?: Ticket[];
}

const defaultTickets: Ticket[] = [
  { ticketId: 'TD-00001', title: 'VPN Connection Timeout - London Office', category: 'Network', date: new Date('2026-01-30T08:15:00'), status: 'critical', priority: 'Critical', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-00002', title: 'VPN Connection Timeout - London Office', category: 'Network', date: new Date('2026-01-30T08:15:00'), status: 'critical', priority: 'Critical', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-00003', title: 'VPN Connection Timeout - London Office', category: 'Network', date: new Date('2026-01-30T08:15:00'), status: 'resolved', priority: 'Critical', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-00004', title: 'VPN Connection Timeout - London Office', category: 'Network', date: new Date('2026-01-30T08:15:00'), status: 'in-progress', priority: 'Critical', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
  { ticketId: 'TD-00005', title: 'VPN Connection Timeout - London Office', category: 'Network', date: new Date('2026-01-30T08:15:00'), status: 'in-progress', priority: 'Critical', assignee: { name: 'Palm Pollapat', fallback: 'PP' } },
];

const STATUS_CONFIG = {
  critical:    { borderColor: 'border-l-red-500',   badgeClass: 'border-red-500 text-red-500',     label: 'CRITICAL'     },
  resolved:    { borderColor: 'border-l-green-500',  badgeClass: 'border-green-500 text-green-600', label: 'RESOLVE'      },
  'in-progress':{ borderColor: 'border-l-amber-400', badgeClass: 'border-amber-400 text-amber-500', label: 'IN PROGRESS'  },
  submitted:   { borderColor: 'border-l-blue-400',   badgeClass: 'border-blue-400 text-blue-500',   label: 'SUBMITTED'    },
};

interface TicketCardProps {
  ticket: Ticket;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}

function TicketCard({ ticket, checked, onCheckedChange }: TicketCardProps) {
  const config = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.submitted;

  const time = ticket.date instanceof Date
    ? ticket.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';
  const dateStr = ticket.date instanceof Date
    ? ticket.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className={`flex items-stretch border-b border-gray-100 border-l-4 ${config.borderColor} bg-white hover:bg-gray-50/60 transition-colors duration-150`}>

      {/* Left: ID, checkbox, time */}
      <div className="flex flex-col items-center justify-center px-4 py-4 w-[120px] shrink-0 border-r border-gray-100 gap-1.5">
        <span className="text-xs font-semibold text-gray-500">#{ticket.ticketId}</span>
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(!!val)}
          className="rounded border-gray-300"
        />
        <span className="text-sm font-bold text-gray-800">{time}</span>
        <span className="text-xs text-gray-400">{dateStr}</span>
      </div>

      {/* Middle: Title + metadata columns */}
      <div className="flex-1 px-6 py-4 flex flex-col justify-center gap-2 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</h4>
        <div className="flex">
          <div className="flex flex-col gap-0.5 w-[160px] shrink-0">
            <span className="text-xs text-gray-400">Category</span>
            <span className="text-xs font-medium text-gray-700 truncate">{ticket.category ?? 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[120px] shrink-0">
            <span className="text-xs text-gray-400">Priority</span>
            <span className="text-xs font-medium text-gray-700 truncate">{ticket.priority ?? 'Normal'}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[160px] shrink-0">
            <span className="text-xs text-gray-400">Assignee</span>
            <span className="text-xs font-medium text-gray-700 truncate">{ticket.assignee?.name ?? '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5 w-[140px] shrink-0">
            <span className="text-xs text-gray-400">Ticket-Id</span>
            <span className="text-xs font-medium text-gray-700 truncate">#{ticket.ticketId}</span>
          </div>
        </div>
      </div>

      {/* Right: Client note + status badge + action icons */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
          <UserCircle size={14} className="text-gray-400" />
          Client note
        </button>

        <div className={`flex items-center border rounded-full overflow-hidden text-xs font-bold whitespace-nowrap ${config.badgeClass}`}>
          <span className="px-3 py-1.5">{config.label}</span>
          <button className={`px-2 py-1.5 border-l ${config.badgeClass} hover:opacity-70 transition-opacity`}>
            <ChevronDown size={13} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 items-center">
          <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-300 transition-colors">
            <Check size={13} />
          </button>
          <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
            <Pencil size={12} />
          </button>
          <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TicketList({ data = defaultTickets }: TicketListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (ticketId: string, val: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      val ? next.add(ticketId) : next.delete(ticketId);
      return next;
    });
  };

  const selectedCount = selected.size;

  return (
    <div className="relative">
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100 bg-white">
        {data.map((ticket) => (
          <TicketCard
            key={ticket.ticketId}
            ticket={ticket}
            checked={selected.has(ticket.ticketId)}
            onCheckedChange={(val) => toggle(ticket.ticketId, val)}
          />
        ))}
      </div>

      {/* Bottom popup bar — slides up when any ticket is selected */}
      <div
        className={`fixed bottom-0 left-72 right-0 z-50 flex items-center justify-between px-10 py-4 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out ${
          selectedCount > 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <span className="text-sm font-medium text-gray-700">
          Select {selectedCount} out of {data.length}
        </span>
        <button
          className="px-6 py-2 bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
          onClick={() => alert(`Merging ${selectedCount} ticket(s)`)}
        >
          Merge
        </button>
      </div>
    </div>
  );
}