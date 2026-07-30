import {
  CalendarDays,
  Clock3,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ChannelKind,
  ChannelStatus,
  HealthStatus,
} from "@/lib/domain";
import { formatDateTime } from "@/lib/overview/formatters";
import { cn } from "@/lib/utils";

export interface ChannelStatusCardProps {
  channels: ChannelStatus[];
  timeZone: string;
}

const channelMeta: Record<
  ChannelKind,
  { icon: LucideIcon; label: string }
> = {
  vapi: { icon: Phone, label: "Telefono" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  booking_provider: {
    icon: CalendarDays,
    label: "Agenda appuntamenti",
  },
};

const statusMeta: Record<
  HealthStatus,
  {
    badge: "success" | "warning" | "destructive" | "outline";
    iconClassName: string;
    label: string;
  }
> = {
  operational: {
    badge: "success",
    iconClassName: "bg-success/12 text-success",
    label: "Operativo",
  },
  degraded: {
    badge: "warning",
    iconClassName:
      "bg-warning/16 text-warning-foreground dark:text-warning",
    label: "Da controllare",
  },
  offline: {
    badge: "destructive",
    iconClassName: "bg-destructive/12 text-destructive",
    label: "Non disponibile",
  },
  not_configured: {
    badge: "outline",
    iconClassName: "bg-muted text-muted-foreground",
    label: "Da collegare",
  },
};

export function ChannelStatusCard({
  channels,
  timeZone,
}: ChannelStatusCardProps) {
  const operationalCount = channels.filter(
    (channel) => channel.status === "operational",
  ).length;

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Stato dei canali</CardTitle>
          <CardDescription className="mt-1">
            Controlla subito cosa è già operativo.
          </CardDescription>
        </div>
        <Badge variant={operationalCount === channels.length ? "success" : "outline"}>
          {operationalCount}/{channels.length} attivi
        </Badge>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {channels.map((channel) => {
            const channelInfo = channelMeta[channel.channel];
            const health = statusMeta[channel.status];
            const Icon = channelInfo.icon;

            return (
              <li className="flex gap-3 py-4 first:pt-0 last:pb-0" key={channel.id}>
                <div
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-2xl",
                    health.iconClassName,
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {channelInfo.label}
                    </p>
                    <Badge variant={health.badge}>{health.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {channel.message ?? "Nessuna nota disponibile."}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    Verificato {formatDateTime(channel.checkedAt, timeZone)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
