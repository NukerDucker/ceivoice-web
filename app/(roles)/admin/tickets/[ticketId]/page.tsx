import TicketDetailPage from '@/components/tickets/TicketDetailPage';

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketDetailPage ticketId={ticketId} />;
}