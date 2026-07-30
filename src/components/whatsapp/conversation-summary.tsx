import {
  Bot,
  CircleAlert,
  Clock3,
  MessageCircleMore,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversationStatus } from "@/lib/domain";
import type { ConversationInboxSummary } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";
import { conversationStatusLabels } from "@/lib/whatsapp/labels";

interface ConversationSummaryProps {
  summary: ConversationInboxSummary;
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

export function ConversationSummary({
  summary,
}: ConversationSummaryProps) {
  const items: Array<{
    description: string;
    icon: LucideIcon;
    label: string;
    tone: string;
    value: number;
  }> = [
    {
      description: "thread presenti nella demo",
      icon: MessageCircleMore,
      label: "Conversazioni",
      tone: "bg-primary/11 text-primary",
      value: summary.totalConversations,
    },
    {
      description: "richiedono il salone",
      icon: CircleAlert,
      label: "Da gestire",
      tone: "bg-warning/16 text-warning-foreground dark:text-warning",
      value: summary.needsIntervention,
    },
    {
      description: "con IA sospesa",
      icon: UserRoundCheck,
      label: "Controllo umano",
      tone: "bg-info/12 text-info",
      value: summary.humanControlled,
    },
    {
      description: "dopo una risposta",
      icon: Clock3,
      label: "In attesa",
      tone: "bg-success/12 text-success",
      value: summary.waitingCustomer,
    },
  ];

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.62fr)]">
      <section
        aria-label="Riepilogo conversazioni WhatsApp"
        className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2"
      >
        {items.map(({ description, icon: Icon, label, tone, value }) => (
          <Card className="min-w-0 overflow-hidden" key={label}>
            <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:p-5">
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-2xl",
                  tone,
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-[-0.04em] sm:text-2xl">
                  {value}
                </p>
                <p className="text-[0.7rem] font-medium leading-4 sm:text-xs">
                  {label}
                </p>
                <p className="mt-0.5 hidden text-[0.68rem] leading-4 text-muted-foreground sm:block">
                  {description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b bg-muted/15">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <Bot aria-hidden="true" className="size-4" />
            </div>
            <CardTitle className="text-sm">Controllo sempre esplicito</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-2">
            {(
              Object.keys(conversationStatusLabels) as ConversationStatus[]
            ).map((status) => (
              <Badge key={status} variant={statusVariants[status]}>
                {conversationStatusLabels[status]}
                <span
                  aria-label={`${summary.statusCounts[status]} conversazioni`}
                  className="ml-0.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[0.65rem]"
                >
                  {summary.statusCounts[status]}
                </span>
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            L’invio umano è consentito soltanto dopo la presa di controllo.
            Finché il salone risponde, l’IA rimane sospesa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
