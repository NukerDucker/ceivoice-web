'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function Header() {
    return (
        <div className="flex items-center justify-between w-full gap-6 rounded-lg border border-gray-300 p-4">
                <h3 className="text-2xl font-bold">My Tickets</h3>
                <Tabs defaultValue="overview" className="shrink-0">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                </Tabs>
                    <InputGroup className="max-w-xs ml-auto">
                    <InputGroupInput placeholder="Search..." />
                    <InputGroupAddon>
                        <Search size={18} />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
                </InputGroup>
                <Button className="gap-2" size="sm">
                    <Plus size={18} />
                    Create New Ticket
                </Button>
        </div>
    )
}