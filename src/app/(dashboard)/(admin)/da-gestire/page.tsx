import type { Metadata } from "next";

import { TreatwellBookingQueue } from "@/components/bookings/treatwell-booking-queue";
import { InterventionsPageClient } from "@/components/interventions/interventions-page-client";
import { loadTreatwellQueue } from "@/lib/bookings/treatwell-booking-repository";

import { completeTreatwellOperationAction } from "./actions";

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
  const treatwellBookings = await loadTreatwellQueue();

  return (
    <div className="space-y-10">
      <TreatwellBookingQueue
        bookings={treatwellBookings}
        completeAction={completeTreatwellOperationAction}
      />
      <div className="border-t pt-10">
        <InterventionsPageClient
          initialInterventionId={initialInterventionId}
        />
      </div>
    </div>
  );
}
