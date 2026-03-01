import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

interface Props {
  params: Promise<{ tracking_id: string }>;
}

export default async function RequestSubmittedPage({ params }: Props) {
  const { tracking_id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
        <p className="text-gray-500 mb-6">
          Your request has been received and is being processed. A confirmation email has been sent to you.
        </p>

        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tracking ID</p>
          <p className="font-mono text-sm font-semibold text-gray-800 break-all">{tracking_id}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/track/${tracking_id}`}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white h-10 px-4 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Track my request
          </Link>
          <Link
            href="/user/dashboard"
            className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 h-10 px-4 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
