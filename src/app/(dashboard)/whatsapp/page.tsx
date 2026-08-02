import type { Metadata } from "next";

import { WhatsAppPageClient } from "@/components/whatsapp/whatsapp-page-client";

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
  const query = await searchParams;
  const initialConversationId = Array.isArray(query.conversation)
    ? query.conversation[0]
    : query.conversation;

  return (
    <WhatsAppPageClient initialConversationId={initialConversationId} />
  );
}
