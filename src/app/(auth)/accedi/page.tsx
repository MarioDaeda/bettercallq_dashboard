import type { Metadata } from "next";
import { Bot, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Accedi",
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const returnTo =
    typeof params.returnTo === "string" ? params.returnTo : "/";

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="flex items-center justify-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Bot aria-hidden="true" className="size-5" />
        </div>
        <div>
          <p className="text-lg font-bold">BetterCallQ</p>
          <p className="text-xs text-muted-foreground">Area riservata</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accedi alla dashboard</CardTitle>
          <CardDescription>
            Usa l’account assegnato da BetterCallQ. La registrazione pubblica
            non è disponibile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured || params.error === "auth_not_configured" ? (
            <div
              className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6"
              role="status"
            >
              <p className="font-semibold">Supabase non configurato</p>
              <p className="mt-1 text-muted-foreground">
                Copia <code>.env.example</code> in <code>.env.local</code> e
                inserisci URL e publishable key del progetto.
              </p>
            </div>
          ) : (
            <LoginForm returnTo={returnTo} />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        Sessione protetta tramite cookie HTTP
      </div>
    </div>
  );
}
