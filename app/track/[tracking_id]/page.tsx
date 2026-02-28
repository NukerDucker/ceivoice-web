import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user_name: string;
}

interface TrackResponse {
  request: {
    request_id: number;
    email: string;
    created_at: string;
    tracking_id: string;
  };
  ticket: {
    ticket_id: number;
    title: string;
    status: string;
    summary: string | null;
    suggested_solution: string | null;
    updated_at: string;
    deadline: string | null;
    comments: Comment[];
  };
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Draft:    { label: 'Draft',       icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-gray-500 bg-gray-100' },
  New:      { label: 'Submitted',   icon: <Clock className="w-4 h-4" />,                color: 'text-blue-600 bg-blue-50'  },
  Assigned: { label: 'In Progress', icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-orange-600 bg-orange-50' },
  Solving:  { label: 'In Progress', icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-orange-600 bg-orange-50' },
  Solved:   { label: 'Resolved',    icon: <CheckCircle2 className="w-4 h-4" />,         color: 'text-green-600 bg-green-50' },
  Failed:   { label: 'Escalated',   icon: <AlertCircle className="w-4 h-4" />,          color: 'text-red-600 bg-red-50'   },
};

interface Props {
  params: Promise<{ tracking_id: string }>;
}

export default async function TrackPage({ params }: Props) {
  const { tracking_id } = await params;

  let data: TrackResponse | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/requests/track/${tracking_id}`,
      { cache: 'no-store' },
    );
    if (res.status === 404) {
      fetchError = 'Request not found. Please check your tracking ID.';
    } else if (!res.ok) {
      fetchError = 'Could not load request details. Please try again later.';
    } else {
      data = await res.json();
    }
  } catch {
    fetchError = 'Network error. Please try again later.';
  }

  const statusCfg = data ? (STATUS_CONFIG[data.ticket.status] ?? STATUS_CONFIG.New) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← CEIVoice
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Track Your Request</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">{tracking_id}</p>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {fetchError}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ticket</p>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{data.ticket.title}</h2>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${statusCfg?.color}`}>
                  {statusCfg?.icon}
                  {statusCfg?.label}
                </span>
              </div>

              {data.ticket.summary && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{data.ticket.summary}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>Submitted {new Date(data.request.created_at).toLocaleDateString()}</span>
                <span>Updated {new Date(data.ticket.updated_at).toLocaleDateString()}</span>
                {data.ticket.deadline && (
                  <span>Deadline {new Date(data.ticket.deadline).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Suggested solution */}
            {data.ticket.suggested_solution && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Suggested Solution</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {data.ticket.suggested_solution}
                </p>
              </div>
            )}

            {/* Comments */}
            {data.ticket.comments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Updates</h3>
                <div className="space-y-4">
                  {data.ticket.comments.map((c) => (
                    <div key={c.comment_id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-orange-600 text-xs font-semibold">
                          {c.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">{c.user_name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
