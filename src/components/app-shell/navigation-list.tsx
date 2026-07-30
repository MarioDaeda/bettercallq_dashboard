"use client";

import {
  Activity,
  Bot,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Phone,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { useInterventionAttentionCount } from "@/components/interventions/intervention-session-context";
import {
  appNavigation,
  type NavigationIcon,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const icons: Record<NavigationIcon, LucideIcon> = {
  overview: LayoutDashboard,
  interventions: ListChecks,
  whatsapp: MessageCircle,
  calls: Phone,
  settings: Bot,
  channels: QrCode,
  monitoring: Activity,
};

interface NavigationListProps {
  attentionCount: number;
  onNavigate?: () => void;
}

export function NavigationList({
  attentionCount,
  onNavigate,
}: NavigationListProps) {
  const pathname = usePathname();
  const currentAttentionCount =
    useInterventionAttentionCount(attentionCount);

  return (
    <nav aria-label="Navigazione principale" className="flex flex-col gap-1.5">
      {appNavigation.map((item) => {
        const Icon = icons[item.icon];
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const showCount =
          item.icon === "interventions" && currentAttentionCount > 0;

        return (
          <Link
            key={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_7px_20px_oklch(0.55_0.2_285/0.18)]"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            href={item.href}
            onClick={onNavigate}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "size-[1.1rem] shrink-0",
                !isActive &&
                  "text-muted-foreground transition-colors group-hover:text-sidebar-accent-foreground",
              )}
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {showCount ? (
              <Badge
                className={cn(
                  "min-w-6 justify-center px-1.5",
                  isActive
                    ? "border-white/20 bg-white/16 text-white"
                    : "border-destructive/20 bg-destructive/12 text-destructive",
                )}
                variant="outline"
              >
                {currentAttentionCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
