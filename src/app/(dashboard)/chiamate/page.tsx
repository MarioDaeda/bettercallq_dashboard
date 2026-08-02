import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CallsPageClient } from "@/components/calls/calls-page-client";
import { ClientCallsPage } from "@/components/client-dashboard/client-calls-page";
import { requireAppSession } from "@/lib/auth/session";
import { loadClientDashboardSnapshot } from "@/lib/client-dashboard/client-dashboard-repository";

export const metadata: Metadata = {
  title: "Chiamate",
};

interface CallsPageProps {
  searchParams: Promise<{
    call?: string | string[];
  }>;
}

export default async function CallsPage({
  searchParams,
}: CallsPageProps) {
  const session = await requireAppSession();

  if (session.role === "salon_owner") {
    if (!session.salonId) {
      redirect("/accesso-non-configurato");
    }

    const snapshot = await loadClientDashboardSnapshot(
      session.salonId,
    );

    return <ClientCallsPage snapshot={snapshot} />;
  }

  const query = await searchParams;
  const initialCallId = Array.isArray(query.call)
    ? query.call[0]
    : query.call;

  return (
    <CallsPageClient initialCallId={initialCallId} />
  );
}
