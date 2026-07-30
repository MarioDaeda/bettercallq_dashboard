"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  description?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  description = "Non siamo riusciti a caricare questa sezione. Riprova tra qualche istante.",
  onRetry,
  title = "Qualcosa non ha funzionato",
}: ErrorStateProps) {
  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-6 py-10 text-center"
      role="alert"
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-destructive/12 text-destructive">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="outline">
          <RefreshCw aria-hidden="true" data-icon="inline-start" />
          Riprova
        </Button>
      ) : null}
    </div>
  );
}
