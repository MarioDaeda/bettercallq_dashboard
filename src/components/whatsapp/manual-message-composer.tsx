"use client";

import { LoaderCircle, LockKeyhole, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ManualMessageComposerProps {
  disabled: boolean;
  disabledReason: string;
  draft: string;
  isPending: boolean;
  onChange: (draft: string) => void;
  onSend: () => void;
}

const MAX_MESSAGE_LENGTH = 1000;

export function ManualMessageComposer({
  disabled,
  disabledReason,
  draft,
  isPending,
  onChange,
  onSend,
}: ManualMessageComposerProps) {
  const valid = draft.trim().length > 0 && draft.length <= MAX_MESSAGE_LENGTH;

  return (
    <form
      className="rounded-2xl border bg-background/70 p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && !isPending && valid) {
          onSend();
        }
      }}
    >
      <label className="text-sm font-semibold" htmlFor="manual-whatsapp-message">
        Risposta manuale
      </label>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {disabled
          ? disabledReason
          : "Il messaggio viene aggiunto soltanto alla sessione demo; Meta non viene contattata."}
      </p>
      <textarea
        className="mt-3 min-h-24 w-full resize-y rounded-2xl border border-input bg-background px-3.5 py-3 text-sm leading-6 shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted/35 disabled:opacity-70"
        disabled={disabled || isPending}
        id="manual-whatsapp-message"
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          disabled
            ? "Risposta manuale non disponibile"
            : "Scrivi una risposta al cliente…"
        }
        value={draft}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {disabled ? (
            <>
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Invio bloccato
            </>
          ) : (
            `${draft.length}/${MAX_MESSAGE_LENGTH}`
          )}
        </span>
        <Button
          disabled={disabled || isPending || !valid}
          type="submit"
        >
          {isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <Send aria-hidden="true" data-icon="inline-start" />
          )}
          Invia nella demo
        </Button>
      </div>
    </form>
  );
}
