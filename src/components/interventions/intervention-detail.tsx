import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  History,
  LoaderCircle,
  MessageCircle,
  PhoneCall,
  PlayCircle,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  InterventionPriority,
  InterventionStatus,
} from "@/lib/domain";
import {
  formatDemoPhoneNumber,
  formatInterventionAge,
} from "@/lib/interventions/formatters";
import {
  bookingSyncStatusLabels,
  callOutcomeLabels,
  interventionPriorityLabels,
  interventionReasonLabels,
  interventionSourceLabels,
  interventionStatusLabels,
} from "@/lib/interventions/labels";
import type { InterventionDetail as InterventionDetailData } from "@/lib/services/dashboard-service";
import { formatDateTime } from "@/lib/overview/formatters";
import { cn } from "@/lib/utils";

interface InterventionDetailProps {
  detail: InterventionDetailData;
  isDialog?: boolean;
  isPending: boolean;
  onCall: () => void;
  onClose?: () => void;
  onOpenWhatsApp: () => void;
  onReopen: () => void;
  onResolve: () => void;
  onStart: () => void;
  referenceTime: string;
  timeZone: string;
}

const priorityVariants: Record<
  InterventionPriority,
  "destructive" | "warning" | "secondary" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const statusVariants: Record<
  InterventionStatus,
  "destructive" | "warning" | "success" | "outline"
> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
  dismissed: "outline",
};

const conversationStatusLabels = {
  ai_handled: "Gestita dall’IA",
  needs_intervention: "Richiede intervento",
  human_control: "Controllo umano",
  waiting_customer: "In attesa del cliente",
  completed: "Completata",
} as const;

export function InterventionDetail({
  detail,
  isDialog = false,
  isPending,
  onCall,
  onClose,
  onOpenWhatsApp,
  onReopen,
  onResolve,
  onStart,
  referenceTime,
  timeZone,
}: InterventionDetailProps) {
  const { intervention, call, conversation, bookingReference } = detail;
  const active = ["open", "in_progress"].includes(intervention.status);
  const idSuffix = isDialog ? "dialog" : "panel";
  const headingId = (section: string) =>
    `intervention-${section}-${idSuffix}`;

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
              <Badge variant={priorityVariants[intervention.priority]}>
                Priorità {interventionPriorityLabels[intervention.priority]}
              </Badge>
              <Badge variant={statusVariants[intervention.status]}>
                {interventionStatusLabels[intervention.status]}
              </Badge>
            </div>
            <CardTitle className="mt-4 text-xl leading-tight">
              {intervention.title}
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {intervention.summary}
            </p>
          </div>

          {onClose ? (
            <Button
              aria-label="Chiudi dettaglio"
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
        <section aria-labelledby={headingId("customer")}>
          <DetailHeading
            icon={UserRound}
            id={headingId("customer")}
            title="Cliente e richiesta"
          />
          <dl className="mt-3 grid gap-3 rounded-2xl border bg-background/50 p-4">
            <DetailRow
              label="Cliente"
              value={intervention.customerName ?? "Non indicato"}
            />
            <DetailRow
              label="Recapito"
              value={
                intervention.customerPhone
                  ? formatDemoPhoneNumber(intervention.customerPhone)
                  : "Non disponibile"
              }
            />
            <DetailRow
              label="Origine"
              value={interventionSourceLabels[intervention.source]}
            />
            <DetailRow
              label="Motivo"
              value={interventionReasonLabels[intervention.reason]}
            />
          </dl>
        </section>

        <section aria-labelledby={headingId("collected")}>
          <DetailHeading
            icon={FileText}
            id={headingId("collected")}
            title="Dati già raccolti"
          />
          <dl className="mt-3 grid gap-3 rounded-2xl border bg-background/50 p-4">
            {call?.requestedService ? (
              <DetailRow
                label="Servizio richiesto"
                value={call.requestedService}
              />
            ) : null}
            {call ? (
              <DetailRow
                label="Esito chiamata"
                value={callOutcomeLabels[call.outcome]}
              />
            ) : null}
            {bookingReference?.serviceName ? (
              <DetailRow
                label="Servizio appuntamento"
                value={bookingReference.serviceName}
              />
            ) : null}
            {bookingReference?.operatorName ? (
              <DetailRow
                label="Operatore"
                value={bookingReference.operatorName}
              />
            ) : null}
            {bookingReference?.startsAt ? (
              <DetailRow
                label="Orario richiesto"
                value={formatDateTime(
                  bookingReference.startsAt,
                  timeZone,
                )}
              />
            ) : null}
            {bookingReference ? (
              <DetailRow
                label="Stato prenotazione"
                value={bookingSyncStatusLabels[bookingReference.syncStatus]}
              />
            ) : null}
            {conversation ? (
              <DetailRow
                label="Stato conversazione"
                value={conversationStatusLabels[conversation.status]}
              />
            ) : null}
            {!call && !bookingReference && !conversation ? (
              <DetailRow
                label="Informazioni"
                value="Nessun altro dato raccolto automaticamente."
              />
            ) : null}
          </dl>
        </section>

        <section aria-labelledby={headingId("timing")}>
          <DetailHeading
            icon={Clock3}
            id={headingId("timing")}
            title="Tempi e gestione"
          />
          <dl className="mt-3 grid gap-3 rounded-2xl border bg-background/50 p-4">
            <DetailRow
              label="Creata"
              value={formatDateTime(intervention.createdAt, timeZone)}
            />
            <DetailRow
              label="Anzianità"
              value={formatInterventionAge(
                intervention.createdAt,
                referenceTime,
              )}
            />
            <DetailRow
              label="Ultimo aggiornamento"
              value={formatDateTime(intervention.updatedAt, timeZone)}
            />
            {intervention.resolvedAt ? (
              <DetailRow
                label="Risolta"
                value={formatDateTime(intervention.resolvedAt, timeZone)}
              />
            ) : null}
          </dl>
        </section>

        {intervention.resolutionNote ? (
          <section
            aria-labelledby={headingId("resolution")}
            className="rounded-2xl border border-success/20 bg-success/[0.055] p-4"
          >
            <DetailHeading
              icon={CheckCircle2}
              id={headingId("resolution")}
              title="Nota di risoluzione"
            />
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {intervention.resolutionNote}
            </p>
          </section>
        ) : null}

        {call || conversation ? (
          <section aria-labelledby={headingId("links")}>
            <DetailHeading
              icon={ArrowUpRight}
              id={headingId("links")}
              title="Collegamenti"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {call ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/chiamate?call=${call.id}`}>
                    <PhoneCall aria-hidden="true" data-icon="inline-start" />
                    Apri chiamata
                    <ExternalLink aria-hidden="true" data-icon="inline-end" />
                  </Link>
                </Button>
              ) : null}
              {conversation ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/whatsapp?conversation=${conversation.id}`}
                  >
                    <MessageCircle
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Apri conversazione
                    <ExternalLink aria-hidden="true" data-icon="inline-end" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby={headingId("actions")}
          className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4"
        >
          <DetailHeading
            icon={PlayCircle}
            id={headingId("actions")}
            title="Azioni simulate"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Nessun cliente reale verrà contattato e nessun provider esterno
            verrà modificato.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {active ? (
              <>
                <Button
                  disabled={!intervention.customerPhone || isPending}
                  onClick={onCall}
                  type="button"
                  variant="outline"
                >
                  <PhoneCall aria-hidden="true" data-icon="inline-start" />
                  Simula chiamata
                </Button>
                <Button
                  disabled={!intervention.customerPhone || isPending}
                  onClick={onOpenWhatsApp}
                  type="button"
                  variant="outline"
                >
                  <MessageCircle
                    aria-hidden="true"
                    data-icon="inline-start"
                  />
                  Simula WhatsApp
                </Button>
                {intervention.status === "open" ? (
                  <Button
                    disabled={isPending}
                    onClick={onStart}
                    type="button"
                    variant="secondary"
                  >
                    <PlayCircle
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Prendi in carico
                  </Button>
                ) : null}
                <Button
                  className={cn(
                    intervention.status !== "open" && "sm:col-span-2",
                  )}
                  disabled={isPending}
                  onClick={onResolve}
                  type="button"
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
                  Segna come risolta
                </Button>
              </>
            ) : (
              <Button
                className="sm:col-span-2"
                disabled={isPending}
                onClick={onReopen}
                type="button"
                variant="outline"
              >
                {isPending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <History aria-hidden="true" data-icon="inline-start" />
                )}
                Riapri richiesta
              </Button>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function DetailHeading({
  icon: Icon,
  id,
  title,
}: {
  icon: typeof UserRound;
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
    <div className="grid gap-1 sm:grid-cols-[8.75rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium sm:text-right">{value}</dd>
    </div>
  );
}
