"use client";

import {
  Bot,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

export type ConversationAction = "take" | "release" | "complete";

interface ConversationActionDialogProps {
  action: ConversationAction | null;
  customerName: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const content = {
  take: {
    title: "Prendere il controllo?",
    description:
      "La receptionist IA verrà sospesa per questa conversazione e il salone potrà inviare messaggi manuali.",
    confirm: "Prendi il controllo",
    Icon: UserRoundCheck,
  },
  release: {
    title: "Restituire la conversazione all’IA?",
    description:
      "Il salone non potrà più inviare messaggi manuali finché non riprenderà il controllo. L’eventuale richiesta collegata verrà risolta.",
    confirm: "Restituisci all’IA",
    Icon: Bot,
  },
  complete: {
    title: "Completare la conversazione?",
    description:
      "La conversazione verrà chiusa nella sessione demo e non accetterà altri messaggi. L’eventuale richiesta collegata verrà risolta.",
    confirm: "Completa conversazione",
    Icon: CheckCircle2,
  },
} as const;

export function ConversationActionDialog({
  action,
  customerName,
  dialogRef,
  isPending,
  onCancel,
  onConfirm,
}: ConversationActionDialogProps) {
  const selected = action ? content[action] : content.take;
  const Icon = selected.Icon;

  return (
    <dialog
      aria-describedby="conversation-action-description"
      aria-labelledby="conversation-action-title"
      className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-3xl border bg-card p-0 text-card-foreground shadow-2xl focus:outline-none"
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) {
          onCancel();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onCancel();
        }
      }}
      ref={dialogRef}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold tracking-tight"
                id="conversation-action-title"
              >
                {selected.title}
              </h2>
              <p
                className="mt-1.5 text-sm leading-6 text-muted-foreground"
                id="conversation-action-description"
              >
                <span className="font-medium text-foreground">
                  {customerName}
                </span>
                : {selected.description}
              </p>
            </div>
          </div>

          <Button
            aria-label="Annulla e chiudi"
            className="size-9 rounded-xl"
            disabled={isPending}
            onClick={onCancel}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4.5" />
          </Button>
        </div>

        <div className="flex items-start gap-3 p-5 text-xs leading-5 text-muted-foreground sm:p-6">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-success"
          />
          Nessun messaggio reale verrà inviato. Il cambio resta nella sessione
          corrente e un ricaricamento ripristina le fixture.
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/15 p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Annulla
          </Button>
          <Button disabled={isPending || action === null} type="submit">
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <Icon aria-hidden="true" data-icon="inline-start" />
            )}
            {selected.confirm}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
