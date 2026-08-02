"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  AuthConfigurationError,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { getSafeReturnTo } from "./paths";

const loginSchema = z.object({
  email: z.string().trim().email("Inserisci un indirizzo email valido."),
  password: z.string().min(8, "La password deve contenere almeno 8 caratteri."),
  returnTo: z.string().optional(),
});

export interface LoginActionState {
  error?: string;
}

export async function signInAction(
  previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void previousState;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dati di accesso non validi.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Autenticazione non configurata. Aggiungi le variabili Supabase in .env.local.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return {
        error: "Email o password non corrette.",
      };
    }
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      return { error: error.message };
    }

    return {
      error: "Accesso non disponibile. Riprova tra poco.",
    };
  }

  redirect(getSafeReturnTo(parsed.data.returnTo ?? null));
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/accedi");
}
