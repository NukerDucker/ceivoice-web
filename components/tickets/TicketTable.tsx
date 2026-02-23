'use client';

import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';

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
}

interface TicketListProps {
  data?: Ticket[];
}

// Mock data with 9 tickets
const defaultTickets: Ticket[] = [
  {
    ticketId: 'TD-001238',
    title: 'VPN Connection Timeout',
    category: 'Network',
    date: new Date('2025-01-30T08:15:00'),
    status: 'submitted',
    assignee: {
      name: 'shadcn',
      fallback: 'SC'
    }
  },
  {
    ticketId: 'TD-001239',
    title: 'Email Server Configuration',
    category: 'Email',
    date: new Date('2025-01-29T14:30:00'),
    status: 'in-progress',
    assignee: {
      name: 'Palm Pollapat',
      fallback: 'PP'
    }
  },
  {
    ticketId: 'TD-001240',
    title: 'Database Connection Pool Issue',
    category: 'Database',
    date: new Date('2025-01-28T10:45:00'),
    status: 'resolved',
    assignee: {
      name: 'John Doe',
      fallback: 'JD'
    }
  },
  {
    ticketId: 'TD-001241',
    title: 'Critical Security Vulnerability',
    category: 'Security',
    date: new Date('2025-01-27T16:20:00'),
    status: 'critical',
    assignee: {
      name: 'Sarah Smith',
      fallback: 'SS'
    }
  },
  {
    ticketId: 'TD-001242',
    title: 'Application Performance Slow',
    category: 'Performance',
    date: new Date('2025-01-26T09:00:00'),
    status: 'in-progress',
    assignee: {
      name: 'Palm Pollapat',
      fallback: 'PP'
    }
  },
  {
    ticketId: 'TD-001243',
    title: 'User Authentication Failed',
    category: 'Authentication',
    date: new Date('2025-01-25T11:30:00'),
    status: 'submitted',
    assignee: {
      name: 'shadcn',
      fallback: 'SC'
    }
  },
  {
    ticketId: 'TD-001244',
    title: 'API Gateway Timeout Error',
    category: 'Network',
    date: new Date('2025-01-24T15:45:00'),
    status: 'critical',
    assignee: {
      name: 'John Doe',
      fallback: 'JD'
    }
  },
  {
    ticketId: 'TD-001245',
    title: 'File Upload Size Limit Issue',
    category: 'Storage',
    date: new Date('2025-01-23T13:20:00'),
    status: 'in-progress',
    assignee: {
      name: 'Sarah Smith',
      fallback: 'SS'
    }
  },
  {
    ticketId: 'TD-001246',
    title: 'Mobile App Crash on Startup',
    category: 'Mobile',
    date: new Date('2025-01-22T08:00:00'),
    status: 'submitted',
    assignee: {
      name: 'Palm Pollapat',
      fallback: 'PP'
    }
  }
];

export function TicketList({ data = defaultTickets }: TicketListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Ticket>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'ticketId',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          ID
          <ArrowUpDown
            className={`size-3 ${
              column.getIsSorted() ? 'text-gray-900' : 'text-gray-400'
            }`}
          />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text- text-gray-700 truncate block">
          {row.getValue('ticketId')}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          Title
          <ArrowUpDown
            className={`size-3 ${
              column.getIsSorted() ? 'text-gray-900' : 'text-gray-400'
            }`}
          />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text- text-gray-900 truncate">
          {row.getValue('title')}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          Category
          <ArrowUpDown
            className={`size-3 ${
              column.getIsSorted() ? 'text-gray-900' : 'text-gray-400'
            }`}
          />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text- text-gray-600 truncate block">
          {row.getValue('category') || 'N/A'}
        </span>
      ),
      size: 112,
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          Date
          <ArrowUpDown
            className={`size-3 ${
              column.getIsSorted() ? 'text-gray-900' : 'text-gray-400'
            }`}
          />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('date') as Date;
        const formattedDate = date instanceof Date
          ? date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : date;
        return (
          <span className="text- text-gray-600 whitespace-nowrap">
            {formattedDate}
          </span>
        );
      },
      size: 112,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          Status
          <ArrowUpDown
            className={`size-3 ${
              column.getIsSorted() ? 'text-gray-900' : 'text-gray-400'
            }`}
          />
        </button>
      ),
      cell: ({ row }) => (
        <Badge variant={row.getValue('status')} className="justify-center w-full">
          {(row.getValue('status') as string).toUpperCase()}
        </Badge>
      ),
      size: 96,
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row }) => {
        const assignee = row.getValue('assignee') as User | undefined;
        return assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-8 flex-shrink-0">
              <AvatarImage alt={assignee.name} src={assignee.avatar} />
              <AvatarFallback>{assignee.fallback}</AvatarFallback>
            </Avatar>
            <span className="text- text-gray-700 truncate">
              {assignee.name}
            </span>
          </div>
        ) : null;
      },
      size: 160,
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-gray-50">
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={`py-3 font-semibold text-gray-700 ${
                      index === 1 ? 'px-1' : 'px-4'
                    }`}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={`py-3 ${index === 1 ? 'px-1' : 'px-4'}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Popup badge that appears only when rows are selected */}
      {selectedCount > 0 && (
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 z-50">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
      )}
    </div>
  );
}