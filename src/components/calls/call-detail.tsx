import {
  Activity,
  ArrowUpRight,
  CalendarCheck2,
  CircleAlert,
  Clock3,
  ExternalLink,
  HeadphoneOff,
  PhoneCall,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { CallTranscript } from "@/components/calls/call-transcript";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCallDuration,
  formatPhoneNumber,
} from "@/lib/calls/formatters";
import {
  bookingProviderLabels,
  bookingSyncStatusLabels,
  callOutcomeDescriptions,
  callOutcomeLabels,
  callProcessingStatusLabels,
} from "@/lib/calls/labels";
import type {
  BookingSyncStatus,
  CallOutcome,
  InterventionPriority,
  InterventionStatus,
} from "@/lib/domain";
import {
  interventionPriorityLabels,
  interventionReasonLabels,
  interventionStatusLabels,
} from "@/lib/interventions/labels";
import { formatDateTime } from "@/lib/overview/formatters";
import type { CallDetail as CallDetailData } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";

interface CallDetailProps {
  detail: CallDetailData;
  isDialog?: boolean;
  onClose?: () => void;
  timeZone: string;
}

const outcomeVariants: Record<
  CallOutcome,
  "success" | "secondary" | "warning" | "outline" | "destructive"
> = {
  booking_completed: "success",
  information_provided: "secondary",
  change_or_cancellation: "warning",
  transferred: "outline",
  incomplete: "warning",
  technical_error: "destructive",
  abandoned: "outline",
};

const processingVariants = {
  receiving: "warning",
  processed: "success",
  failed: "destructive",
} as const;

const bookingVariants: Record<
  BookingSyncStatus,
  "success" | "warning" | "destructive" | "outline"
> = {
  pending: "warning",
  synced: "success",
  failed: "destructive",
  cancelled: "outline",
};

const interventionPriorityVariants: Record<
  InterventionPriority,
  "destructive" | "warning" | "secondary" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const interventionStatusVariants: Record<
  InterventionStatus,
  "destructive" | "warning" | "success" | "outline"
> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
  dismissed: "outline",
};

export function CallDetail({
  detail,
  isDialog = false,
  onClose,
  timeZone,
}: CallDetailProps) {
  const { call, bookingReference, intervention } = detail;
  const idSuffix = isDialog ? "dialog" : "panel";
  const headingId = (section: string) => `call-${section}-${idSuffix}`;
  const needsAttention = [
    "incomplete",
    "technical_error",
    "abandoned",
  ].includes(call.outcome);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isDialog &&
          "max-h-[92dvh] overflow-y-auto rounded-b-none border-x-0 border-b-0 shadow-2xl",
      )}
    >
      <CardHeader className="border-b bg-muted/15">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant={outcomeVariants[call.outcome]}>
                {callOutcomeLabels[call.outcome]}
              </Badge>
              <Badge variant={processingVariants[call.processingStatus]}>
                {callProcessingStatusLabels[call.processingStatus]}
              </Badge>
            </div>
            <CardTitle className="mt-4 text-xl leading-tight">
              {call.customerName ?? "Cliente non identificato"}
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {call.summary ??
                "Nessun riepilogo disponibile per questa chiamata."}
            </p>
          </div>

          {onClose ? (
            <Button
              aria-label="Chiudi dettaglio chiamata"
              className="size-9 rounded-xl"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4.5" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5 sm:pt-6">
        <section aria-labelledby={headingId("request")}>
          <DetailHeading
            icon={UserRound}
            id={headingId("request")}
            title="Cliente e richiesta"
          />
          <dl className="mt-3 grid gap-3 rounded-2xl border bg-background/50 p-4">
            <DetailRow
              label="Cliente"
              value={call.customerName ?? "Non indicato"}
            />
            <DetailRow
              label="Numero"
              value={formatPhoneNumber(call.customerPhone)}
            />
            <DetailRow
              label="Servizio richiesto"
              value={call.requestedService ?? "Non indicato"}
            />
            <DetailRow
              label="Canale"
              value="Receptionist vocale Vapi"
            />
          </dl>
        </section>

        <section aria-labelledby={headingId("timing")}>
          <DetailHeading
            icon={Clock3}
            id={headingId("timing")}
            title="Data e durata"
          />
          <dl className="mt-3 grid gap-3 rounded-2xl border bg-background/50 p-4">
            <DetailRow
              label="Inizio"
              value={formatDateTime(call.startedAt, timeZone)}
            />
            <DetailRow
              label="Durata"
              value={formatCallDuration(call.durationSeconds)}
            />
            <DetailRow
              label="Fine"
              value={
                call.endedAt
                  ? formatDateTime(call.endedAt, timeZone)
                  : "Chiamata ancora in elaborazione"
              }
            />
          </dl>
        </section>

        <section
          aria-labelledby={headingId("outcome")}
          className={cn(
            "rounded-2xl border p-4",
            needsAttention
              ? "border-warning/25 bg-warning/[0.075]"
              : "border-success/20 bg-success/[0.055]",
          )}
        >
          <DetailHeading
            icon={needsAttention ? CircleAlert : ShieldCheck}
            id={headingId("outcome")}
            title={needsAttention ? "Esito da verificare" : "Esito gestito"}
          />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {callOutcomeDescriptions[call.outcome]}
          </p>
        </section>

        {bookingReference ? (
          <section aria-labelledby={headingId("booking")}>
            <DetailHeading
              icon={CalendarCheck2}
              id={headingId("booking")}
              title="Riferimento appuntamento"
            />
            <div className="mt-3 rounded-2xl border bg-background/50 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={bookingVariants[bookingReference.syncStatus]}>
                  {bookingSyncStatusLabels[bookingReference.syncStatus]}
                </Badge>
                <Badge variant="outline">
                  {bookingProviderLabels[bookingReference.provider]}
                </Badge>
              </div>
              <dl className="mt-4 grid gap-3">
                <DetailRow
                  label="Servizio"
                  value={bookingReference.serviceName ?? "Non indicato"}
                />
                <DetailRow
                  label="Operatore"
                  value={bookingReference.operatorName ?? "Non assegnato"}
                />
                <DetailRow
                  label="Data"
                  value={
                    bookingReference.startsAt
                      ? formatDateTime(bookingReference.startsAt, timeZone)
                      : "Da verificare"
                  }
                />
                <DetailRow
                  label="Riferimento"
                  value={
                    bookingReference.externalBookingId ??
                    "Identificativo esterno non disponibile"
                  }
                />
              </dl>
              {bookingReference.externalUrl ? (
                <Button
                  asChild
                  className="mt-4"
                  size="sm"
                  variant="outline"
                >
                  <a
                    href={bookingReference.externalUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Apri nel provider
                    <ExternalLink aria-hidden="true" data-icon="inline-end" />
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Nessun collegamento esterno disponibile: l’accesso a
                  Treatwell è ancora da verificare.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {intervention ? (
          <section
            aria-labelledby={headingId("intervention")}
            className="rounded-2xl border border-primary/20 bg-primary/[0.045] p-4"
          >
            <DetailHeading
              icon={CircleAlert}
              id={headingId("intervention")}
              title="Intervento collegato"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant={interventionPriorityVariants[intervention.priority]}
              >
                Priorità {interventionPriorityLabels[intervention.priority]}
              </Badge>
              <Badge variant={interventionStatusVariants[intervention.status]}>
                {interventionStatusLabels[intervention.status]}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold">{intervention.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {interventionReasonLabels[intervention.reason]}
              {" · "}
              {intervention.summary}
            </p>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link href={`/da-gestire?intervention=${intervention.id}`}>
                Apri in Da gestire
                <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
          </section>
        ) : null}

        <section aria-labelledby={headingId("transcript")}>
          <DetailHeading
            icon={Activity}
            id={headingId("transcript")}
            title="Trascrizione"
          />
          <div className="mt-3">
            <CallTranscript segments={call.transcript} />
          </div>
        </section>

        <section
          aria-labelledby={headingId("audio")}
          className="rounded-2xl border border-dashed bg-muted/20 p-4"
        >
          <DetailHeading
            icon={HeadphoneOff}
            id={headingId("audio")}
            title="Registrazione audio disattivata"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Il prototipo non richiede né riproduce audio. Riepilogo e
            trascrizione sono sufficienti per il controllo operativo previsto.
          </p>
        </section>

        <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-3 text-[0.68rem] leading-5 text-muted-foreground">
          <PhoneCall aria-hidden="true" className="size-3.5 shrink-0" />
          ID dimostrativo: {call.externalCallId}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailHeading({
  icon: Icon,
  id,
  title,
}: {
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold" id={id}>
      <Icon aria-hidden="true" className="size-4 text-primary" />
      {title}
    </h3>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm sm:text-right">{value}</dd>
    </div>
  );
}
