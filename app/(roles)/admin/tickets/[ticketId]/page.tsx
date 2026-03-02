// Admin — ticket detail view

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return (
    <div className="flex-1 px-10 pt-6 pb-10 bg-gray-50 overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Ticket #{ticketId}</h1>
      {/* TODO: fetch ticket and render admin view */}
      <p className="text-gray-500">Ticket details loading…</p>
    </div>
  );
}
