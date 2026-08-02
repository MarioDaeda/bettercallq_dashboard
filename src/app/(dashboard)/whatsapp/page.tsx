import type { Metadata } from "next";

import { ClientWhatsAppPage } from "@/components/client-dashboard/client-whatsapp-page";
import { WhatsAppPageClient } from "@/components/whatsapp/whatsapp-page-client";
import { requireAppSession } from "@/lib/auth/session";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const metadata: Metadata = {
  title: "WhatsApp",
};

interface WhatsAppPageProps {
  searchParams: Promise<{
    conversation?: string | string[];
  }>;
}

export default async function WhatsAppPage({
  searchParams,
}: WhatsAppPageProps) {
  const session = await requireAppSession();

  if (session.role === "salon_owner") {
    const salonId = session.salonId ?? PILOT_SALON_ID;
    const [salon, inbox] = await Promise.all([
      dashboardService.getSalon(salonId),
      dashboardService.listConversationInbox(salonId),
    ]);

    return (
      <ClientWhatsAppPage inbox={inbox} timeZone={salon.timezone} />
    );
  }

  const query = await searchParams;
  const initialConversationId = Array.isArray(query.conversation)
    ? query.conversation[0]
    : query.conversation;

  return (
    <WhatsAppPageClient initialConversationId={initialConversationId} />
  );
}
