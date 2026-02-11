'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle, // Add this back
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Link2, Smile, Image, Triangle, Clock, Edit3, MoreHorizontal, Trash2 } from 'lucide-react';

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketModal({ open, onOpenChange }: CreateTicketModalProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');

  const handleSubmit = () => {
    console.log({ email, subject, bodyText });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[540px] h-[720px] p-0 overflow-hidden !fixed !right-4 !top-1/2 !-translate-y-1/2 !left-auto !translate-x-0 flex flex-col bg-white">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 border rounded">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </div>
            {/* 1. Added DialogTitle back with 'sr-only' class to fix the error */}
            {/* This makes it visible to screen readers but invisible on your screen */}
            <DialogTitle className="sr-only">Create New Ticket</DialogTitle>
            
            <span className="text-xs font-semibold uppercase tracking-wide">
              CREATE NEW TICKET
            </span>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="px-6 pt-4 pb-4 flex-1 flex flex-col min-h-0">
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            {/* Email Field */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-bold mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 text-sm bg-white"
              />
            </div>

            {/* Describe Issues Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-sm font-bold mb-2">
                Describe your issues or request
              </label>
              
              <div className="border rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Subject Line */}
                <div className="p-3 border-b flex-shrink-0">
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="border-0 p-0 h-auto text-sm focus-visible:ring-0 shadow-none font-medium"
                  />
                </div>

                {/* Body Textarea */}
                <div className="flex-1 overflow-hidden">
                   <Textarea
                    placeholder="Body Text"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full h-full border-0 resize-none focus-visible:ring-0 text-sm p-3 overflow-y-auto"
                  />
                </div>
                
                {/* Formatting Toolbar */}
                <div className="border-t px-2 py-1.5 flex items-center gap-0.5 bg-gray-50 flex-shrink-0 flex-wrap">
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm">↶</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm">↷</button>
                  <div className="h-4 w-px bg-gray-300 mx-0.5" />
                  <select className="px-2 py-1 hover:bg-gray-200 rounded text-xs border-0 bg-transparent cursor-pointer">
                    <option>Sans Serif</option>
                  </select>
                  <div className="h-4 w-px bg-gray-300 mx-0.5" />
                  <button className="p-1.5 hover:bg-gray-200 rounded font-bold text-xs">B</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded italic text-xs">I</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded underline text-xs">U</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-xs">A</button>
                </div>

                {/* Bottom Action Bar */}
                <div className="border-t px-3 py-2 flex items-center justify-between flex-shrink-0 bg-white">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={handleSubmit}
                      className="bg-[#2b59ff] hover:bg-blue-700 text-white h-9 px-6 text-sm font-semibold rounded-md"
                    >
                      Send
                    </Button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><span className="text-base font-semibold">A</span></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Paperclip className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Link2 className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Smile className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Triangle className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Image className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Clock className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Edit3 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}