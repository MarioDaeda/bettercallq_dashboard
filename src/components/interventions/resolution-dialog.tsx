"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

interface ResolutionDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
  isPending: boolean;
  note: string;
  onCancel: () => void;
  onConfirm: () => void;
  onNoteChange: (note: string) => void;
  targetTitle: string;
}

export function ResolutionDialog({
  dialogRef,
  isPending,
  note,
  onCancel,
  onConfirm,
  onNoteChange,
  targetTitle,
}: ResolutionDialogProps) {
  return (
    <dialog
      aria-describedby="resolution-dialog-description"
      aria-labelledby="resolution-dialog-title"
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
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-warning/16 text-warning-foreground dark:text-warning">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold tracking-tight"
                id="resolution-dialog-title"
              >
                Segnare come risolta?
              </h2>
              <p
                className="mt-1.5 text-sm leading-6 text-muted-foreground"
                id="resolution-dialog-description"
              >
                “{targetTitle}” verrà rimossa dalla coda attiva e il conteggio
                della Panoramica verrà aggiornato.
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

        <div className="p-5 sm:p-6">
          <label
            className="text-sm font-semibold"
            htmlFor="resolution-note"
          >
            Nota di risoluzione
          </label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Scrivi in poche parole cosa è stato fatto. Nel prototipo la nota
            resta solo nella sessione corrente.
          </p>
          <textarea
            autoFocus
            className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-input bg-background px-3.5 py-3 text-sm leading-6 shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            disabled={isPending}
            id="resolution-note"
            maxLength={280}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Es. Cliente richiamato e richiesta completata."
            required
            value={note}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>La richiesta potrà comunque essere riaperta.</span>
            <span>{note.length}/280</span>
          </div>
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
          <Button
            disabled={isPending || note.trim().length === 0}
            type="submit"
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <CheckCircle2
                aria-hidden="true"
                data-icon="inline-start"
              />
            )}
            Conferma risoluzione
          </Button>
        </div>
      </form>
    </dialog>
  );
}
