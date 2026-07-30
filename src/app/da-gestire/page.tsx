import type { Metadata } from "next";

import { InterventionsPageClient } from "@/components/interventions/interventions-page-client";

export const metadata: Metadata = {
  title: "Da gestire",
};

interface InterventionsPageProps {
  searchParams: Promise<{
    intervention?: string | string[];
  }>;
}

export default async function InterventionsPage({
  searchParams,
}: InterventionsPageProps) {
  const query = await searchParams;
  const initialInterventionId = Array.isArray(query.intervention)
    ? query.intervention[0]
    : query.intervention;

  return (
    <InterventionsPageClient
      initialInterventionId={initialInterventionId}
    />
  );
}
