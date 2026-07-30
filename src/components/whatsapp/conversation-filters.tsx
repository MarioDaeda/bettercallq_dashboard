"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConversationStatus } from "@/lib/domain";
import { conversationStatusLabels } from "@/lib/whatsapp/labels";

export interface ConversationFilterState {
  query: string;
  status: "all" | ConversationStatus;
}

export const defaultConversationFilters: ConversationFilterState = {
  query: "",
  status: "all",
};

interface ConversationFiltersProps {
  filters: ConversationFilterState;
  isRefreshing: boolean;
  onChange: (filters: ConversationFilterState) => void;
  onReset: () => void;
  resultCount: number;
}

const fieldClassName =
  "h-10 min-w-0 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function ConversationFilters({
  filters,
  isRefreshing,
  onChange,
  onReset,
  resultCount,
}: ConversationFiltersProps) {
  const hasFilters = filters.status !== "all" || filters.query.trim() !== "";
  const statuses = Object.keys(conversationStatusLabels) as ConversationStatus[];

  return (
    <section
      aria-label="Filtri delle conversazioni WhatsApp"
      className="rounded-2xl border bg-card p-4 shadow-[0_1px_2px_oklch(0.18_0.03_278/0.04)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Trova una conversazione</h2>
              {hasFilters ? (
                <Badge variant="secondary">Filtri attivi</Badge>
              ) : null}
            </div>
            <p
              aria-live="polite"
              className="mt-0.5 text-xs text-muted-foreground"
            >
              {isRefreshing
                ? "Aggiornamento inbox…"
                : `${resultCount} ${resultCount === 1 ? "conversazione" : "conversazioni"}`}
            </p>
          </div>
        </div>

        <Button
          disabled={!hasFilters || isRefreshing}
          onClick={onReset}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" data-icon="inline-start" />
          Azzera
        </Button>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.42fr)]">
        <label className="relative min-w-0">
          <span className="sr-only">Cerca per cliente, numero o messaggio</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className={`${fieldClassName} pl-9`}
            disabled={isRefreshing}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder="Cliente, numero o testo del messaggio"
            type="search"
            value={filters.query}
          />
        </label>

        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground sm:grid-cols-[auto_1fr] sm:items-center">
          <span>Stato</span>
          <select
            className={fieldClassName}
            disabled={isRefreshing}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as ConversationFilterState["status"],
              })
            }
            value={filters.status}
          >
            <option value="all">Tutti gli stati</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {conversationStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
