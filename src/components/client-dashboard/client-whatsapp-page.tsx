import {
  Bot,
  MessageCircle,
  UserRoundCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import type {
  ClientConversationData,
  ClientDashboardSnapshot,
} from "@/lib/client-dashboard/client-data";
import {
  formatClientDateTime,
  getConversationStatusLabel,
} from "@/lib/client-dashboard/formatters";

interface ClientWhatsAppPageProps {
  snapshot: ClientDashboardSnapshot;
}

function ConversationList({
  conversations,
  timeZone,
}: {
  conversations: ClientConversationData[];
  timeZone: string;
}) {
  if (conversations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessuna conversazione disponibile.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {conversations.slice(0, 20).map((conversation) => (
        <div
          className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          key={conversation.id}
        >
          <div className="min-w-0">
            <p className="font-semibold">
              {conversation.customerPhone}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {conversation.summary ??
                "Conversazione WhatsApp"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatClientDateTime(
                conversation.lastMessageAt ??
                  conversation.createdAt,
                timeZone,
              )}
            </p>
          </div>
          <Badge
            variant={
              conversation.status ===
              "needs_intervention"
                ? "warning"
                : "secondary"
            }
          >
            {getConversationStatusLabel(
              conversation.status,
            )}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function ClientWhatsAppPage({
  snapshot,
}: ClientWhatsAppPageProps) {
  const passedToSalon = snapshot.conversations.filter(
    (conversation) =>
      conversation.control === "human" ||
      conversation.status === "needs_intervention",
  ).length;
  const automated = Math.max(
    snapshot.conversations.length - passedToSalon,
    0,
  );

  const summary = [
    {
      icon: MessageCircle,
      label: "Conversazioni",
      value: snapshot.conversations.length,
    },
    {
      icon: Bot,
      label: "Gestite automaticamente",
      value: automated,
    },
    {
      icon: UserRoundCheck,
      label: "Passate al salone",
      value: passedToSalon,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        badge={
          snapshot.source === "fixtures"
            ? "WhatsApp · dati dimostrativi"
            : "Monitoraggio WhatsApp"
        }
        description="Una vista read-only delle conversazioni, senza configurazioni Meta o controlli tecnici."
        title="WhatsApp"
      />

      <Card>
        <CardHeader>
          <CardTitle>Situazione complessiva</CardTitle>
          <CardDescription>
            Il canale resta gestito da BetterCallQ; qui trovi
            soltanto i dati principali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-xl border bg-muted/25 p-4"
                  key={item.label}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Icon
                      aria-hidden="true"
                      className="size-4"
                    />
                    {item.label}
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {item.value.toLocaleString("it-IT")}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attività recente</CardTitle>
          <CardDescription>
            Numeri completi e stato sintetico, senza messaggi o
            comandi di gestione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationList
            conversations={snapshot.conversations}
            timeZone={snapshot.salon.timezone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
