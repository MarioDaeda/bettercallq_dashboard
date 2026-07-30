import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  badge?: string;
  className?: string;
  description: string;
  title: string;
}

export function PageHeader({
  badge,
  className,
  description,
  title,
}: PageHeaderProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {badge ? (
        <Badge className="mb-4" variant="secondary">
          {badge}
        </Badge>
      ) : null}
      <h1 className="text-balance text-2xl font-bold tracking-[-0.035em] sm:text-3xl lg:text-[2.15rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}
