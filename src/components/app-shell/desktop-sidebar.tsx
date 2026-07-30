import { CircleHelp, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Brand } from "./brand";
import { NavigationList } from "./navigation-list";

export function DesktopSidebar({
  attentionCount,
}: {
  attentionCount: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar/90 px-4 py-5 text-sidebar-foreground backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Brand />
      </div>

      <div className="mt-8">
        <p className="mb-2 px-3 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Il tuo salone
        </p>
        <NavigationList attentionCount={attentionCount} />
      </div>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-primary/12 bg-primary/[0.055] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Modalità demo
            </div>
            <Badge variant="secondary">Fixture</Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            I contenuti mostrati sono dimostrativi. Nessun cliente reale.
          </p>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
          <CircleHelp aria-hidden="true" className="size-3.5" />
          <span>BetterCallQ · Pilota</span>
        </div>
      </div>
    </aside>
  );
}
