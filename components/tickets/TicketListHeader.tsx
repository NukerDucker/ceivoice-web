'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Ticket } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CreateTicketModal } from "@/components/tickets/ReplyBox";

interface HeaderProps {
    userEmail?: string;
    userId?: string;
}

export function Header({ userEmail, userId }: HeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between w-full gap-6 p-4">
                <div className="flex items-center gap-6">
                    <h3 className="text-2xl font-bold">My Tickets</h3>
                    <Tabs defaultValue="opened" className="shrink-0">
                        <TabsList>
                            <TabsTrigger value="opened">Opened (10)</TabsTrigger>
                            <TabsTrigger value="closed">Closed (5)</TabsTrigger>
                            <TabsTrigger value="all">All (15)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="Search..." />
                        <InputGroupAddon>
                            <Search size={18} />
                        </InputGroupAddon>
                    </InputGroup>
                    <Button
                        className="gap-2"
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Ticket size={18} />
                        CREATE NEW TICKET
                    </Button>
                </div>
            </div>

            <CreateTicketModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultEmail={userEmail}
                defaultUserId={userId}
            />
        </>
    );
}
