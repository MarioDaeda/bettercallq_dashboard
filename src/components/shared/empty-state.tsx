import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  children?: React.ReactNode;
  className?: string;
  description: string;
  eyebrow?: string;
  title: string;
}

export function EmptyState({
  children,
  className,
  description,
  eyebrow = "Nessun dato",
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/25 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <Inbox aria-hidden="true" className="size-5" />
      </div>
      <p className="mt-4 text-xs font-bold tracking-[0.12em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
