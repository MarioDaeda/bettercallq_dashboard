import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { z } from "zod";

import type { AppIdentity, IdentitySource } from "./identity";

const persistedIdentityRowSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().trim().min(1).max(120),
  platform_role: z.enum(["admin", "standard"]),
  salon_id: z.string().uuid().nullable(),
  membership_role: z
    .enum(["owner", "manager", "viewer", "support"])
    .nullable(),
});

const persistedIdentityRowsSchema = z.array(
  persistedIdentityRowSchema,
);

type PersistedIdentityRow = z.infer<
  typeof persistedIdentityRowSchema
>;

export type PersistedIdentityResolution =
  | {
      identity: AppIdentity;
      status: "resolved";
    }
  | {
      status: "not_configured";
    }
  | {
      status: "unavailable";
    };

function resolveEmail(user: IdentitySource): string | null {
  return user.email?.trim().toLowerCase() || null;
}

function resolveAdminIdentity(
  user: IdentitySource,
  row: PersistedIdentityRow,
  email: string,
): AppIdentity | null {
  if (
    row.platform_role !== "admin" ||
    row.salon_id !== null ||
    row.membership_role !== null
  ) {
    return null;
  }

  return {
    displayName: row.display_name,
    email,
    role: "admin",
    userId: user.id,
  };
}

function resolveSalonOwnerIdentity(
  user: IdentitySource,
  row: PersistedIdentityRow,
  email: string,
): AppIdentity | null {
  if (
    row.platform_role !== "standard" ||
    !row.salon_id ||
    !row.membership_role ||
    row.membership_role === "support"
  ) {
    return null;
  }

  return {
    displayName: row.display_name,
    email,
    role: "salon_owner",
    salonId: row.salon_id,
    userId: user.id,
  };
}

export function resolvePersistedIdentity(
  user: IdentitySource,
  rows: unknown,
): AppIdentity | null {
  const email = resolveEmail(user);
  const parsed = persistedIdentityRowsSchema.safeParse(rows);

  if (!email || !parsed.success || parsed.data.length !== 1) {
    return null;
  }

  const [row] = parsed.data;

  if (row.user_id !== user.id) {
    return null;
  }

  return (
    resolveAdminIdentity(user, row, email) ??
    resolveSalonOwnerIdentity(user, row, email)
  );
}

export async function loadPersistedAppIdentity(
  supabase: SupabaseClient,
  user: Pick<
    User,
    "app_metadata" | "email" | "id" | "user_metadata"
  >,
): Promise<PersistedIdentityResolution> {
  const { data, error } = await supabase.rpc(
    "current_app_identity",
  );

  if (error) {
    return {
      status: "unavailable",
    };
  }

  const identity = resolvePersistedIdentity(user, data);

  if (!identity) {
    return {
      status: "not_configured",
    };
  }

  return {
    identity,
    status: "resolved",
  };
}
