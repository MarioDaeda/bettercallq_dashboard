import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck2,
  ListTodo,
  MessageCircle,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CallOutcome } from "@/lib/domain";
import { formatDateTime } from "@/lib/overview/formatters";
import type { OverviewActivity } from "@/lib/services/dashboard-service";

export interface RecentActivityCardProps {
  activities: OverviewActivity[];
  timeZone: string;
}

type ActivityPresentation = {
  badge: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
};

const callOutcomeLabels: Record<CallOutcome, string> = {
  booking_completed: "Prenotazione completata",
  information_provided: "Informazioni fornite",
  change_or_cancellation: "Modifica richiesta",
  transferred: "Chiamata trasferita",
  incomplete: "Richiesta incompleta",
  technical_error: "Errore durante la chiamata",
  abandoned: "Chiamata interrotta",
};

const presentActivity = (
  activity: OverviewActivity,
): ActivityPresentation => {
  switch (activity.kind) {
    case "call":
      return {
        badge: "Telefono",
        description:
          activity.item.summary ??
          `Chiamata di ${activity.item.customerName ?? "cliente demo"}.`,
        href: "/chiamate",
        icon:
          activity.item.outcome === "technical_error"
            ? AlertTriangle
            : PhoneCall,
        iconClassName:
          activity.item.outcome === "technical_error"
            ? "bg-destructive/12 text-destructive"
            : "bg-primary/10 text-primary",
        title: callOutcomeLabels[activity.item.outcome],
      };
    case "conversation":
      return {
        badge: "WhatsApp",
        description:
          activity.item.summary ??
          `Conversazione con ${activity.item.customerName ?? "cliente demo"}.`,
        href: "/whatsapp",
        icon: MessageCircle,
        iconClassName: "bg-success/12 text-success",
        title:
          activity.item.control === "human"
            ? "Conversazione presa in carico"
            : "Conversazione gestita dall’IA",
      };
    case "intervention":
      return {
        badge: "Da gestire",
        description: activity.item.summary,
        href: "/da-gestire",
        icon: ListTodo,
        iconClassName:
          activity.item.priority === "urgent"
            ? "bg-destructive/12 text-destructive"
            : "bg-warning/16 text-warning-foreground dark:text-warning",
        title: activity.item.title,
      };
    case "booking":
      return {
        badge: "Agenda",
        description:
          activity.item.syncStatus === "failed"
            ? "La sincronizzazione richiede una verifica del salone."
            : `${activity.item.serviceName ?? "Servizio demo"} attribuito a BetterCallQ.`,
        href: "/chiamate",
        icon: CalendarCheck2,
        iconClassName:
          activity.item.syncStatus === "failed"
            ? "bg-destructive/12 text-destructive"
            : "bg-info/12 text-info",
        title:
          activity.item.syncStatus === "failed"
            ? "Prenotazione non sincronizzata"
            : "Prenotazione registrata",
      };
  }
};

export function RecentActivityCard({
  activities,
  timeZone,
}: RecentActivityCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Attività recenti</CardTitle>
        <CardDescription>
          Le ultime operazioni dimostrative gestite sui diversi canali.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center">
            <p className="font-semibold">Nessuna attività nel periodo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prova a selezionare un intervallo più ampio.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => {
              const presentation = presentActivity(activity);
              const Icon = presentation.icon;

              return (
                <li key={`${activity.kind}-${activity.item.id}`}>
                  <Link
                    className="group flex h-full gap-3 rounded-2xl border bg-muted/[0.16] p-4 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    href={presentation.href}
                  >
                    <div
                      className={`grid size-10 shrink-0 place-items-center rounded-2xl ${presentation.iconClassName}`}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline">{presentation.badge}</Badge>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        {presentation.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {presentation.description}
                      </p>
                      <p className="mt-3 text-[0.7rem] text-muted-foreground">
                        {formatDateTime(activity.occurredAt, timeZone)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
