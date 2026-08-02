export interface SupabasePublicConfig {
  publishableKey: string;
  url: string;
}

export class AuthConfigurationError extends Error {
  constructor() {
    super(
      "Supabase Auth non è configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
    this.name = "AuthConfigurationError";
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new AuthConfigurationError();
  }

  return { publishableKey, url };
}
