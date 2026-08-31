"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAppSession } from "@/lib/auth/session";
import { completeTreatwellOperation } from "@/lib/bookings/treatwell-booking-repository";

const bookingIdSchema = z.string().uuid();

export async function completeTreatwellOperationAction(
  formData: FormData,
): Promise<void> {
  const session = await requireAppSession();
  if (session.role !== "admin") {
    throw new Error("Operazione non autorizzata.");
  }

  const bookingId = bookingIdSchema.parse(formData.get("bookingId"));
  await completeTreatwellOperation(bookingId);
  revalidatePath("/da-gestire");
}
