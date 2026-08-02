import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientWhatsAppPage } from "@/components/client-dashboard/client-whatsapp-page";
import { WhatsAppPageClient } from "@/components/whatsapp/whatsapp-page-client";
import { requireAppSession } from "@/lib/auth/session";
import { loadClientDashboardSnapshot } from "@/lib/client-dashboard/client-dashboard-repository";

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
    if (!session.salonId) {
      redirect("/accesso-non-configurato");
    }

    const snapshot = await loadClientDashboardSnapshot(
      session.salonId,
    );

    return <ClientWhatsAppPage snapshot={snapshot} />;
  }

  const query = await searchParams;
  const initialConversationId = Array.isArray(
    query.conversation,
  )
    ? query.conversation[0]
    : query.conversation;

  return (
    <WhatsAppPageClient
      initialConversationId={initialConversationId}
    />
  );
}
