"use client";

import { LogOut, MapPin, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppIdentity } from "@/lib/auth/identity";
import type { AppRole } from "@/lib/auth/permissions";
import { signOutAction } from "@/lib/auth/actions";
import type { ChannelStatus, Salon } from "@/lib/domain";
import { getNavigationItem } from "@/lib/navigation";

import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "./theme-toggle";

interface TopBarProps {
  attentionCount: number;
  channels: ChannelStatus[];
  role: AppRole;
  salon: Salon;
  user: AppIdentity;
}

const getHealthSummary = (channels: ChannelStatus[]) => {
  const hasProblem = channels.some((channel) =>
    ["offline", "degraded"].includes(channel.status),
  );
  const needsSetup = channels.some(
    (channel) => channel.status === "not_configured",
  );

  if (hasProblem) {
    return {
      label: "Verifica necessaria",
      compactLabel: "Da verificare",
      variant: "destructive" as const,
      dotClassName: "bg-destructive",
    };
  }

  if (needsSetup) {
    return {
      label: "Configurazione in corso",
      compactLabel: "In configurazione",
      variant: "warning" as const,
      dotClassName: "bg-warning",
    };
  }

  return {
    label: "Tutti i canali operativi",
    compactLabel: "Operativo",
    variant: "success" as const,
    dotClassName: "bg-success",
  };
};

export function TopBar({
  attentionCount,
  channels,
  role,
  salon,
  user,
}: TopBarProps) {
  const pathname = usePathname();
  const currentItem = getNavigationItem(pathname, role);
  const health = getHealthSummary(channels);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-xl sm:px-5 lg:min-h-[4.5rem] lg:px-7">
      <MobileNavigation attentionCount={attentionCount} role={role} />

      <div className="min-w-0 flex-1 px-1">
        <p className="truncate text-sm font-semibold lg:text-base">
          <span className="lg:hidden">{currentItem.shortLabel}</span>
          <span className="hidden lg:inline">{salon.name}</span>
        </p>
        <div className="mt-0.5 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex lg:mt-1">
          <MapPin aria-hidden="true" className="size-3.5" />
          <span className="truncate">
            {salon.address?.city ?? "Salone pilota"}
            {" · "}
            {role === "admin" ? "Console amministrativa" : "Area riservata"}
          </span>
        </div>
      </div>

      <Badge
        className="hidden max-w-[9.5rem] md:flex sm:max-w-none"
        variant={health.variant}
      >
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${health.dotClassName}`}
        />
        <span className="truncate lg:hidden">{health.compactLabel}</span>
        <span className="hidden lg:inline">{health.label}</span>
      </Badge>

      <div
        className="hidden min-w-0 items-center gap-2 rounded-xl border bg-muted/35 px-2.5 py-1.5 xl:flex"
        title={user.email}
      >
        <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="max-w-36 truncate text-xs font-semibold">
            {user.displayName}
          </p>
          <p className="text-[0.65rem] text-muted-foreground">
            {role === "admin" ? "Amministratore" : "Proprietario"}
          </p>
        </div>
      </div>

      <ThemeToggle />

      <form action={signOutAction}>
        <Button
          aria-label="Esci"
          className="size-10 rounded-xl"
          size="icon"
          title="Esci"
          type="submit"
          variant="ghost"
        >
          <LogOut aria-hidden="true" className="size-4.5" />
        </Button>
      </form>
    </header>
  );
}
