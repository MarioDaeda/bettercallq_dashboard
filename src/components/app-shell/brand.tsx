import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-[0.9rem] bg-primary text-primary-foreground shadow-[0_8px_24px_oklch(0.55_0.2_285/0.26)]">
        <Sparkles aria-hidden="true" className="size-[1.15rem]" />
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success" />
      </div>
      <div className={cn("min-w-0", compact && "sr-only")}>
        <p className="truncate text-[0.94rem] font-bold tracking-[-0.02em]">
          BetterCallQ
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Receptionist intelligente
        </p>
      </div>
    </div>
  );
}
