import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-muted [background-image:linear-gradient(90deg,transparent,oklch(1_0_0/0.35),transparent)] [background-size:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
