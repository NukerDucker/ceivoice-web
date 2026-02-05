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
  data: Ticket[];
}

export function TicketList({ data }: TicketListProps) {
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

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
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
    </div>
  );
}
