import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { resolveAppIdentity, type AppIdentity } from "./identity";

export async function getCurrentAppSession(): Promise<AppIdentity | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return resolveAppIdentity(user);
}

export async function requireAppSession(): Promise<AppIdentity> {
  if (!isSupabaseConfigured()) {
    redirect("/accedi?error=auth_not_configured");
  }

  const session = await getCurrentAppSession();

  if (!session) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/accesso-non-configurato");
    }

    redirect("/accedi");
  }

  return session;
}
