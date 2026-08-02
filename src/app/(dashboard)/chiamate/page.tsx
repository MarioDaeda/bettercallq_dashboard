import type { Metadata } from "next";

import { CallsPageClient } from "@/components/calls/calls-page-client";

export const metadata: Metadata = {
  title: "Chiamate",
};

interface CallsPageProps {
  searchParams: Promise<{
    call?: string | string[];
  }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const query = await searchParams;
  const initialCallId = Array.isArray(query.call) ? query.call[0] : query.call;

  return <CallsPageClient initialCallId={initialCallId} />;
}
