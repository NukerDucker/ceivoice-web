'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-markdown-preview/markdown.css';

const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div data-color-mode="light" className={className}>
      <MDPreview source={content} style={{ background: 'transparent', fontSize: '13.5px' }} />
    </div>
  );
}
