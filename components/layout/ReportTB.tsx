'use client';

import { Search } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function Header() {
  return (
    <div className="relative px-6 pt-6">
      <div className="flex items-center justify-between w-full gap-6 p-4 bg-white rounded-xl shadow-sm">
        <h3 className="text-2xl font-bold">Reports</h3>

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