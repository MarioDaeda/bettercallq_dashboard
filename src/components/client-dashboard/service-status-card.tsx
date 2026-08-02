import {
  CircleCheck,
  CircleDashed,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientChannelData } from "@/lib/client-dashboard/client-data";
import {
  formatClientDateTime,
  getHealthStatusLabel,
} from "@/lib/client-dashboard/formatters";
import type { HealthStatus } from "@/lib/domain";

interface ServiceStatusCardProps {
  channels: ClientChannelData[];
  timeZone: string;
}

const channelLabels = {
  vapi: "Chiamate",
  whatsapp: "WhatsApp",
} as const;

function getVariant(status: HealthStatus) {
  if (status === "operational") {
    return "success" as const;
  }

  if (status === "offline") {
    return "destructive" as const;
  }

  return "warning" as const;
}

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === "operational") {
    return (
      <CircleCheck
        aria-hidden="true"
        className="size-4 text-success"
      />
    );
  }

  if (status === "offline" || status === "degraded") {
    return (
      <TriangleAlert
        aria-hidden="true"
        className="size-4 text-warning"
      />
    );
  }

  return (
    <CircleDashed
      aria-hidden="true"
      className="size-4 text-muted-foreground"
    />
  );
}

export function ServiceStatusCard({
  channels,
  timeZone,
}: ServiceStatusCardProps) {
  const visibleChannels = (["vapi", "whatsapp"] as const).map(
    (channel) => {
      const status = channels.find(
        (item) => item.channel === channel,
      );

      return {
        channel,
        checkedAt: status?.checkedAt,
        status:
          status?.status ?? ("not_configured" as const),
      };
    },
  );

  const latestCheck = visibleChannels
    .map((channel) => channel.checkedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stato del servizio</CardTitle>
        <CardDescription>
          Una lettura sintetica dei due canali disponibili al
          salone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleChannels.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-xl border bg-muted/25 p-3.5"
            key={item.channel}
          >
            <div className="flex items-center gap-2.5">
              <StatusIcon status={item.status} />
              <span className="text-sm font-semibold">
                {channelLabels[item.channel]}
              </span>
            </div>
            <Badge variant={getVariant(item.status)}>
              {getHealthStatusLabel(item.status)}
            </Badge>
          </div>
        ))}

        <p className="pt-1 text-xs text-muted-foreground">
          {latestCheck
            ? `Ultimo aggiornamento: ${formatClientDateTime(
                latestCheck,
                timeZone,
              )}`
            : "Stato non ancora aggiornato."}
        </p>
      </CardContent>
    </Card>
  );
}
