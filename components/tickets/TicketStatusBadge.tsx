'use client';

import { Badge } from '@/components/ui/badge';

type TicketStatus = 'submitted' | 'in-progress' | 'resolved' | 'critical';

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  submitted:    { label: 'Submitted',   className: 'border-blue-400 text-blue-500' },
  'in-progress':{ label: 'In Progress', className: 'border-amber-400 text-amber-500' },
  resolved:     { label: 'Resolved',    className: 'border-green-500 text-green-600' },
  critical:     { label: 'Critical',    className: 'border-red-500 text-red-500' },
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
