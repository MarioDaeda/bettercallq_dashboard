import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  description: string;
  icon: LucideIcon;
  label: string;
  tone: "primary" | "success" | "warning" | "info";
  value: ReactNode;
}

const toneStyles: Record<KpiCardProps["tone"], string> = {
  primary: "bg-primary/11 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning-foreground dark:text-warning",
  info: "bg-info/12 text-info",
};

export function KpiCard({
  description,
  icon: Icon,
  label,
  tone,
  value,
}: KpiCardProps) {
  return (
    <Card className="group relative h-full overflow-hidden">
      <div
        aria-hidden="true"
        className={cn(
          "absolute -top-10 -right-10 size-28 rounded-full opacity-45 blur-3xl transition-opacity group-hover:opacity-70",
          toneStyles[tone],
        )}
      />
      <CardHeader className="relative flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            toneStyles[tone],
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-3xl font-bold tracking-[-0.045em] sm:text-[2rem]">
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
