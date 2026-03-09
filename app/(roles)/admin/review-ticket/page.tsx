'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-700 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Redirecting…</p>
      </div>
    </div>
  );
}

function ReviewTicketRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/admin/tickets/${id}`);
    } else {
      router.replace('/admin/tickets');
    }
  }, [id, router]);

  return <Spinner />;
}

export default function ReviewTicketPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReviewTicketRedirect />
    </Suspense>
  );
}
