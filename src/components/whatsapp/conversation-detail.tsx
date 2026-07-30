import {
  ArrowUpRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  MessageSquareText,
  PauseCircle,
  RotateCcw,
  UserRoundCheck,
  X,
} from "lucide-react";
import Link from "next/link";

import type { ConversationAction } from "@/components/whatsapp/conversation-action-dialog";
import { ManualMessageComposer } from "@/components/whatsapp/manual-message-composer";
import { MessageThread } from "@/components/whatsapp/message-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/calls/formatters";
import {
  bookingProviderLabels,
  bookingSyncStatusLabels,
} from "@/lib/calls/labels";
import type { ConversationStatus } from "@/lib/domain";
import {
  interventionReasonLabels,
  interventionStatusLabels,
} from "@/lib/interventions/labels";
import { formatDateTime } from "@/lib/overview/formatters";
import type { ConversationDetail as ConversationDetailData } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";
import {
  conversationControlLabels,
  conversationStatusDescriptions,
  conversationStatusLabels,
} from "@/lib/whatsapp/labels";

interface ConversationDetailProps {
  detail: ConversationDetailData;
  draft: string;
  isDialog?: boolean;
  onClose?: () => void;
  onDraftChange: (draft: string) => void;
  onRequestAction: (action: ConversationAction) => void;
  onSend: () => void;
  pendingAction: string | null;
  timeZone: string;
}

const statusVariants: Record<
  ConversationStatus,
  "secondary" | "warning" | "outline" | "success"
> = {
  ai_handled: "secondary",
  needs_intervention: "warning",
  human_control: "outline",
  waiting_customer: "outline",
  completed: "success",
};

export function ConversationDetail({
  detail,
  draft,
  isDialog = false,
  onClose,
  onDraftChange,
  onRequestAction,
  onSend,
  pendingAction,
  timeZone,
}: ConversationDetailProps) {
  const {
    aiRepliesAllowed,
    bookingReference,
    conversation,
    intervention,
    messages,
  } = detail;
  const customerName =
    conversation.customerName ?? "Cliente non identificato";
  const canSendManually =
    conversation.control === "human" &&
    conversation.status !== "completed";
  const idSuffix = isDialog ? "dialog" : "panel";
  const headingId = (section: string) =>
    `whatsapp-${section}-${idSuffix}`;

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
              <Badge variant={statusVariants[conversation.status]}>
                {conversationStatusLabels[conversation.status]}
              </Badge>
              <Badge variant={aiRepliesAllowed ? "success" : "outline"}>
                {aiRepliesAllowed ? (
                  <Bot aria-hidden="true" className="size-3.5" />
                ) : (
                  <PauseCircle aria-hidden="true" className="size-3.5" />
                )}
                {aiRepliesAllowed ? "IA attiva" : "IA sospesa"}
              </Badge>
            </div>
            <CardTitle className="mt-4 text-xl leading-tight">
              {customerName}
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {formatPhoneNumber(conversation.customerPhone)}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {conversation.summary ??
                "Nessun riepilogo disponibile per questa conversazione."}
            </p>
          </div>

          {onClose ? (
            <Button
              aria-label="Chiudi dettaglio conversazione"
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
        <section
          aria-labelledby={headingId("control")}
          className={cn(
            "rounded-2xl border p-4",
            conversation.status === "needs_intervention" &&
              "border-warning/25 bg-warning/[0.07]",
            conversation.status === "completed" &&
              "border-success/20 bg-success/[0.055]",
            conversation.control === "human" &&
              conversation.status !== "completed" &&
              "border-info/20 bg-info/[0.055]",
            aiRepliesAllowed && "border-primary/15 bg-primary/[0.045]",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                aiRepliesAllowed
                  ? "bg-success/12 text-success"
                  : "bg-warning/16 text-warning-foreground dark:text-warning",
              )}
            >
              {aiRepliesAllowed ? (
                <Bot aria-hidden="true" className="size-4.5" />
              ) : conversation.status === "completed" ? (
                <CheckCircle2 aria-hidden="true" className="size-4.5" />
              ) : (
                <PauseCircle aria-hidden="true" className="size-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold" id={headingId("control")}>
                Controllo: {conversationControlLabels[conversation.control]}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {conversationStatusDescriptions[conversation.status]}
              </p>
            </div>
          </div>

          {conversation.status !== "completed" ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {conversation.control === "ai" ? (
                <Button
                  disabled={pendingAction !== null}
                  onClick={() => onRequestAction("take")}
                  type="button"
                >
                  <UserRoundCheck
                    aria-hidden="true"
                    data-icon="inline-start"
                  />
                  Prendi il controllo
                </Button>
              ) : (
                <>
                  <Button
                    disabled={pendingAction !== null}
                    onClick={() => onRequestAction("release")}
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw aria-hidden="true" data-icon="inline-start" />
                    Restituisci all’IA
                  </Button>
                  <Button
                    disabled={pendingAction !== null}
                    onClick={() => onRequestAction("complete")}
                    type="button"
                    variant="secondary"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Completa
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </section>

        {bookingReference || intervention ? (
          <section aria-labelledby={headingId("references")}>
            <h3
              className="flex items-center gap-2 text-sm font-semibold"
              id={headingId("references")}
            >
              <ArrowUpRight aria-hidden="true" className="size-4 text-primary" />
              Riferimenti collegati
            </h3>
            <div className="mt-3 grid gap-3">
              {bookingReference ? (
                <div className="rounded-2xl border bg-background/55 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2
                      aria-hidden="true"
                      className="size-4 text-success"
                    />
                    <p className="text-sm font-semibold">
                      {bookingReference.serviceName ??
                        "Appuntamento dimostrativo"}
                    </p>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs">
                    {bookingReference.startsAt ? (
                      <DetailRow
                        label="Quando"
                        value={formatDateTime(
                          bookingReference.startsAt,
                          timeZone,
                        )}
                      />
                    ) : null}
                    <DetailRow
                      label="Provider"
                      value={bookingProviderLabels[bookingReference.provider]}
                    />
                    <DetailRow
                      label="Stato"
                      value={
                        bookingSyncStatusLabels[
                          bookingReference.syncStatus
                        ]
                      }
                    />
                  </dl>
                </div>
              ) : null}

              {intervention ? (
                <div className="rounded-2xl border bg-background/55 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CircleAlert
                          aria-hidden="true"
                          className="size-4 text-warning-foreground dark:text-warning"
                        />
                        <p className="truncate text-sm font-semibold">
                          {intervention.title}
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {interventionReasonLabels[intervention.reason]} ·{" "}
                        {interventionStatusLabels[intervention.status]}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/da-gestire?intervention=${intervention.id}`}
                      >
                        Apri
                        <ExternalLink
                          aria-hidden="true"
                          data-icon="inline-end"
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section aria-labelledby={headingId("messages")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className="flex items-center gap-2 text-sm font-semibold"
              id={headingId("messages")}
            >
              <MessageSquareText
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Messaggi
            </h3>
            <span className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? "messaggio" : "messaggi"}
            </span>
          </div>
          <div className="mt-3">
            <MessageThread messages={messages} timeZone={timeZone} />
          </div>
        </section>

        <ManualMessageComposer
          disabled={!canSendManually}
          disabledReason={
            conversation.status === "completed"
              ? "La conversazione è completata e non accetta nuovi messaggi."
              : "Prendi il controllo per sospendere l’IA e abilitare la risposta manuale."
          }
          draft={draft}
          isPending={pendingAction === "send"}
          onChange={onDraftChange}
          onSend={onSend}
        />
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
