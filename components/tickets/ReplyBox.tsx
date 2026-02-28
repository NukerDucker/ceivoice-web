'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Link2, Smile, Image, Triangle, Clock, Edit3, MoreHorizontal, Trash2 } from 'lucide-react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function CreateTicketModal({ open, onOpenChange, defaultEmail = '' }: CreateTicketModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const message = subject.trim()
      ? `**${subject.trim()}**\n\n${bodyText.trim()}`
      : bodyText.trim();

    if (!email || !message) {
      setError('Email and message are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      onOpenChange(false);
      router.push(`/request-submitted/${data.tracking_id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              <label className="block text-sm font-bold mb-2">Email</label>
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

                {/* Markdown Editor */}
                <div className="flex-1 overflow-hidden" data-color-mode="light">
                  <MDEditor
                    value={bodyText}
                    onChange={(val) => setBodyText(val ?? '')}
                    preview="edit"
                    hideToolbar={false}
                    height="100%"
                    style={{ border: 'none', boxShadow: 'none' }}
                  />
                </div>

                {/* Bottom Action Bar */}
                <div className="border-t px-3 py-2 flex items-center justify-between flex-shrink-0 bg-white">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-[#2b59ff] hover:bg-blue-700 text-white h-9 px-6 text-sm font-semibold rounded-md"
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
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

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
