import {
  Bot,
  ChevronDown,
  FileText,
  ShieldCheck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatTranscriptOffset } from "@/lib/calls/formatters";
import { transcriptSpeakerLabels } from "@/lib/calls/labels";
import type { TranscriptSegment } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface CallTranscriptProps {
  segments: TranscriptSegment[] | undefined;
}

const speakerIcons: Record<TranscriptSegment["speaker"], LucideIcon> = {
  customer: UserRound,
  assistant: Bot,
  system: Wrench,
};

const speakerTone: Record<TranscriptSegment["speaker"], string> = {
  customer: "bg-secondary text-secondary-foreground",
  assistant: "bg-primary/11 text-primary",
  system: "bg-warning/16 text-warning-foreground dark:text-warning",
};

export function CallTranscript({ segments }: CallTranscriptProps) {
  if (!segments?.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <FileText aria-hidden="true" className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Trascrizione non disponibile</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Potrebbe non essere stata prodotta oppure essere già uscita dal
              periodo di conservazione previsto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <details className="group overflow-hidden rounded-2xl border bg-background/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none transition hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/35 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Apri trascrizione
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {segments.length}{" "}
              {segments.length === 1 ? "passaggio" : "passaggi"} disponibili
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t p-4">
        <ol className="space-y-3">
          {segments.map((segment, index) => {
            const SpeakerIcon = speakerIcons[segment.speaker];

            return (
              <li
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
                key={`${segment.startedAtSeconds}-${index}`}
              >
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-xl",
                    speakerTone[segment.speaker],
                  )}
                >
                  <SpeakerIcon aria-hidden="true" className="size-3.5" />
                </div>
                <div className="min-w-0 rounded-2xl bg-muted/35 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      {transcriptSpeakerLabels[segment.speaker]}
                    </Badge>
                    <span className="font-mono text-[0.68rem] text-muted-foreground">
                      {formatTranscriptOffset(segment.startedAtSeconds)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6">{segment.text}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-success"
          />
          Contenuto dimostrativo. Le trascrizioni reali avranno una conservazione
          breve e configurabile.
        </div>
      </div>
    </details>
  );
}
