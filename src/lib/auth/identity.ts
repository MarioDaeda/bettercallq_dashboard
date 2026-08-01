import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import type { AppRole } from "./permissions";

const appMetadataSchema = z
  .object({
    app_role: z.enum(["admin", "salon_owner"]),
    display_name: z.string().trim().min(1).optional(),
    salon_id: z.string().trim().min(1).optional(),
  })
  .passthrough();

export interface AppIdentity {
  displayName: string;
  email: string;
  role: AppRole;
  salonId?: string;
  userId: string;
}

export type IdentitySource = Pick<
  User,
  "app_metadata" | "email" | "id" | "user_metadata"
>;

export function resolveAppIdentity(
  user: IdentitySource,
): AppIdentity | null {
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const metadata = appMetadataSchema.safeParse(user.app_metadata);

  if (!metadata.success) {
    return null;
  }

  const { app_role: role, display_name: displayName, salon_id: salonId } =
    metadata.data;

  if (role === "salon_owner" && !salonId) {
    return null;
  }

  const fallbackDisplayName =
    typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : email.split("@")[0];

  return {
    displayName: displayName ?? fallbackDisplayName,
    email,
    role,
    salonId,
    userId: user.id,
  };
}
