"use client";

import {
  CalendarClock,
  CircleHelp,
  MessagesSquare,
  Scissors,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  settingsSectionLabels,
  settingsSections,
  type SettingsSection,
} from "@/lib/settings/settings";
import { cn } from "@/lib/utils";

const icons: Record<SettingsSection, LucideIcon> = {
  profile: Store,
  services: Scissors,
  schedule: CalendarClock,
  faqs: CircleHelp,
  behavior: MessagesSquare,
  escalation: ShieldCheck,
};

interface SettingsSectionNavProps {
  activeSection: SettingsSection;
  errorCounts: Partial<Record<SettingsSection, number>>;
  onSelect: (section: SettingsSection) => void;
}

export function SettingsSectionNav({
  activeSection,
  errorCounts,
  onSelect,
}: SettingsSectionNavProps) {
  return (
    <nav
      aria-label="Sezioni impostazioni IA"
      className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
    >
      {settingsSections.map((section) => {
        const Icon = icons[section];
        const isActive = section === activeSection;
        const errorCount = errorCounts[section] ?? 0;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 lg:w-full",
              isActive
                ? "border-primary/20 bg-primary text-primary-foreground shadow-sm"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
            )}
            key={section}
            onClick={() => onSelect(section)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{settingsSectionLabels[section]}</span>
            {errorCount > 0 ? (
              <Badge
                className={cn(
                  "ml-auto min-w-6 justify-center px-1.5",
                  isActive
                    ? "border-white/20 bg-white/18 text-white"
                    : "border-destructive/20 bg-destructive/12 text-destructive",
                )}
                variant="outline"
              >
                {errorCount}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
