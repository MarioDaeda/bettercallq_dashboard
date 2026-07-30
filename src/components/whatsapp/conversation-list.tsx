import {
  Bot,
  ChevronRight,
  CircleAlert,
  MessageCircle,
  UserRoundCheck,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/calls/formatters";
import type { ConversationStatus } from "@/lib/domain";
import { interventionStatusLabels } from "@/lib/interventions/labels";
import type { ConversationListItem } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";
import { formatConversationActivity } from "@/lib/whatsapp/formatters";
import {
  conversationControlLabels,
  conversationStatusLabels,
  messageAuthorLabels,
} from "@/lib/whatsapp/labels";

interface ConversationListProps {
  items: ConversationListItem[];
  onResetFilters: () => void;
  onSelect: (conversationId: string) => void;
  referenceTime: string;
  selectedId: string | null;
  totalItems: number;
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

export function ConversationList({
  items,
  onResetFilters,
  onSelect,
  referenceTime,
  selectedId,
  totalItems,
}: ConversationListProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="border-b bg-muted/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Inbox WhatsApp</CardTitle>
            <CardDescription className="mt-1">
              Le conversazioni più recenti sono in alto. Stato e controllo
              restano sempre visibili.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {totalItems}{" "}
            {totalItems === 1 ? "conversazione" : "conversazioni"}
          </Badge>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <CardContent className="pt-5 sm:pt-6">
          <EmptyState
            className="min-h-[28rem]"
            description="Nessuna conversazione corrisponde alla ricerca o allo stato selezionato. Azzera i filtri per tornare all’intera inbox."
            eyebrow="Inbox filtrata"
            title="Nessuna conversazione trovata"
          >
            <Button onClick={onResetFilters} type="button" variant="outline">
              Azzera i filtri
            </Button>
          </EmptyState>
        </CardContent>
      ) : (
        <CardContent className="pt-4 sm:pt-5">
          <ol className="space-y-2.5">
            {items.map(({ conversation, intervention, lastMessage }) => {
              const selected = selectedId === conversation.id;
              const ControlIcon =
                conversation.control === "human" ? UserRoundCheck : Bot;

              return (
                <li key={conversation.id}>
                  <button
                    aria-label={`Apri conversazione di ${conversation.customerName ?? formatPhoneNumber(conversation.customerPhone)}`}
                    aria-pressed={selected}
                    className={cn(
                      "group w-full rounded-2xl border p-4 text-left transition duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                      selected
                        ? "border-primary/35 bg-primary/[0.065] shadow-[0_10px_30px_oklch(0.55_0.2_285/0.09)]"
                        : "bg-background/45 hover:border-primary/25 hover:bg-muted/35",
                    )}
                    onClick={() => onSelect(conversation.id)}
                    type="button"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-2xl font-semibold",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {conversation.customerName?.match(/\d+$/)?.[0] ?? (
                          <MessageCircle
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold tracking-tight">
                              {conversation.customerName ??
                                "Cliente non identificato"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {formatPhoneNumber(conversation.customerPhone)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[0.68rem] font-medium text-muted-foreground">
                              {formatConversationActivity(
                                conversation.lastMessageAt ??
                                  conversation.updatedAt,
                                referenceTime,
                              )}
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            />
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
                          {lastMessage
                            ? `${messageAuthorLabels[lastMessage.author]}: ${lastMessage.body}`
                            : conversation.summary ??
                              "Nessun messaggio disponibile."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={statusVariants[conversation.status]}>
                            {conversationStatusLabels[conversation.status]}
                          </Badge>
                          <Badge variant="outline">
                            <ControlIcon
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            {conversationControlLabels[conversation.control]}
                          </Badge>
                          {intervention ? (
                            <Badge
                              variant={
                                ["open", "in_progress"].includes(
                                  intervention.status,
                                )
                                  ? "warning"
                                  : "success"
                              }
                            >
                              <CircleAlert
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {interventionStatusLabels[intervention.status]}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}
