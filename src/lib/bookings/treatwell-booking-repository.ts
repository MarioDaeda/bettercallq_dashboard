import { z } from "zod";

import {
  treatwellBookingRowSchema,
  type TreatwellBookingRow,
} from "@/lib/persistence/database-contracts";
import { createClient } from "@/lib/supabase/server";

const queueSchema = z.array(treatwellBookingRowSchema);

export class TreatwellQueueDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TreatwellQueueDataError";
  }
}

export async function loadTreatwellQueue(
  salonId?: string,
): Promise<TreatwellBookingRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(
      "id,salon_id,customer_name,customer_phone,service_code,service_name,duration_minutes,starts_at,ends_at,status,treatwell_status,google_calendar_event_id,channel,created_at,updated_at",
    )
    .in("treatwell_status", [
      "to_sync",
      "update_required",
      "cancellation_required",
    ])
    .order("starts_at", { ascending: true });

  if (salonId) {
    query = query.eq("salon_id", salonId);
  }

  const { data, error } = await query;
  if (error) {
    throw new TreatwellQueueDataError(
      `Coda Treatwell non disponibile: ${error.message}`,
    );
  }

  return queueSchema.parse(data ?? []);
}

export async function completeTreatwellOperation(
  bookingId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "complete_treatwell_operation",
    { p_booking_id: bookingId },
  );

  if (error || !data) {
    throw new TreatwellQueueDataError(
      `Operazione Treatwell non completata: ${error?.message ?? "risposta non valida"}`,
    );
  }
}
