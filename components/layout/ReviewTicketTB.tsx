// components/layout/Header.tsx  (or wherever your Header lives)
'use client';

import { Search } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'My Dashboard', subtitle }: HeaderProps) {
  return (
    <div className="relative px-6 pt-6">
      <div className="flex items-center justify-between w-full gap-6 p-4 bg-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <InputGroup className="max-w-xs">
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <Search size={18} />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}