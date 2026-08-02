"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  signInAction,
  type LoginActionState,
} from "@/lib/auth/actions";

const initialState: LoginActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LockKeyhole aria-hidden="true" className="size-4" />
      )}
      {pending ? "Accesso in corso..." : "Accedi"}
    </Button>
  );
}

export function LoginForm({
  returnTo,
}: {
  returnTo: string;
}) {
  const [state, formAction] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
          id="email"
          name="email"
          placeholder="nome@bettercallq.it"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          className="rounded-xl border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
