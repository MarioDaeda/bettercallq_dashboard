import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CallPaginationProps {
  onPageChange: (page: number) => void;
  page: number;
  totalItems: number;
  totalPages: number;
}

export function CallPagination({
  onPageChange,
  page,
  totalItems,
  totalPages,
}: CallPaginationProps) {
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (candidate) =>
      totalPages <= 5 ||
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav
      aria-label="Paginazione chiamate"
      className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-5"
    >
      <p className="text-xs text-muted-foreground">
        {totalItems} {totalItems === 1 ? "chiamata" : "chiamate"}
        <span aria-hidden="true"> · </span>
        pagina {page} di {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          aria-label="Pagina precedente"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {visiblePages.map((candidate, index) => {
            const previous = visiblePages[index - 1];
            const showGap = previous !== undefined && candidate - previous > 1;

            return (
              <span className="flex items-center gap-1" key={candidate}>
                {showGap ? (
                  <span
                    aria-hidden="true"
                    className="px-1 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : null}
                <Button
                  aria-current={candidate === page ? "page" : undefined}
                  aria-label={`Pagina ${candidate}`}
                  onClick={() => onPageChange(candidate)}
                  size="icon-sm"
                  type="button"
                  variant={candidate === page ? "secondary" : "ghost"}
                >
                  {candidate}
                </Button>
              </span>
            );
          })}
        </div>

        <Button
          aria-label="Pagina successiva"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
