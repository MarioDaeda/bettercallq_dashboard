"use client";

import { Funnel, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  interventionPriorityLabels,
  interventionReasonLabels,
  interventionSourceLabels,
  interventionStatusLabels,
} from "@/lib/interventions/labels";
import { cn } from "@/lib/utils";

export interface InterventionFilterState {
  status: "active" | "all" | keyof typeof interventionStatusLabels;
  priority: "all" | keyof typeof interventionPriorityLabels;
  source: "all" | keyof typeof interventionSourceLabels;
  reason: "all" | keyof typeof interventionReasonLabels;
  from: string;
  to: string;
}

export const defaultInterventionFilters: InterventionFilterState = {
  status: "active",
  priority: "all",
  source: "all",
  reason: "all",
  from: "",
  to: "",
};

interface InterventionFiltersProps {
  filters: InterventionFilterState;
  isRefreshing: boolean;
  onChange: (filters: InterventionFilterState) => void;
  onReset: () => void;
  reportingDate: string;
  resultCount: number;
}

const fieldClassName =
  "h-10 min-w-0 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const priorities = ["urgent", "high", "medium", "low"] as const;
const sources = ["call", "whatsapp", "booking", "integration"] as const;
const reasons = [
  "human_requested",
  "service_not_recognized",
  "availability_unavailable",
  "booking_incomplete",
  "special_request",
  "booking_sync_failed",
  "customer_dispute",
  "integration_error",
  "other",
] as const;

export function InterventionFilters({
  filters,
  isRefreshing,
  onChange,
  onReset,
  reportingDate,
  resultCount,
}: InterventionFiltersProps) {
  const hasCustomFilters =
    filters.status !== defaultInterventionFilters.status ||
    filters.priority !== "all" ||
    filters.source !== "all" ||
    filters.reason !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

  const update = <Key extends keyof InterventionFilterState>(
    key: Key,
    value: InterventionFilterState[Key],
  ) => {
    const next = { ...filters, [key]: value };

    if (key === "from" && next.to !== "" && next.from > next.to) {
      next.to = next.from;
    }
    if (key === "to" && next.from !== "" && next.to < next.from) {
      next.from = next.to;
    }

    onChange(next);
  };

  return (
    <section
      aria-label="Filtri della coda"
      className="rounded-2xl border bg-card p-4 shadow-[0_1px_2px_oklch(0.18_0.03_278/0.04)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Funnel aria-hidden="true" className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Filtra la coda</h2>
              {hasCustomFilters ? (
                <Badge variant="secondary">Personalizzati</Badge>
              ) : null}
            </div>
            <p
              aria-live="polite"
              className="mt-0.5 text-xs text-muted-foreground"
            >
              {isRefreshing
                ? "Aggiornamento risultati…"
                : `${resultCount} ${resultCount === 1 ? "risultato" : "risultati"}`}
            </p>
          </div>
        </div>

        <Button
          disabled={!hasCustomFilters || isRefreshing}
          onClick={onReset}
          size="sm"
          type="button"
          variant="ghost"
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Azzera
        </Button>
      </div>

      <div
        className={cn(
          "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1.05fr_1fr_1.2fr_1fr_1fr]",
          isRefreshing && "opacity-80",
        )}
      >
        <FilterField label="Stato">
          <select
            className={fieldClassName}
            onChange={(event) =>
              update(
                "status",
                event.target.value as InterventionFilterState["status"],
              )
            }
            value={filters.status}
          >
            <option value="active">Attive</option>
            <option value="all">Tutti gli stati</option>
            {Object.entries(interventionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Priorità">
          <select
            className={fieldClassName}
            onChange={(event) =>
              update(
                "priority",
                event.target.value as InterventionFilterState["priority"],
              )
            }
            value={filters.priority}
          >
            <option value="all">Tutte</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {interventionPriorityLabels[value]}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Canale">
          <select
            className={fieldClassName}
            onChange={(event) =>
              update(
                "source",
                event.target.value as InterventionFilterState["source"],
              )
            }
            value={filters.source}
          >
            <option value="all">Tutti</option>
            {sources.map((value) => (
              <option key={value} value={value}>
                {interventionSourceLabels[value]}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Motivo">
          <select
            className={fieldClassName}
            onChange={(event) =>
              update(
                "reason",
                event.target.value as InterventionFilterState["reason"],
              )
            }
            value={filters.reason}
          >
            <option value="all">Tutti</option>
            {reasons.map((value) => (
              <option key={value} value={value}>
                {interventionReasonLabels[value]}
              </option>
            ))}
          </select>
        </FilterField>

        <div className="grid grid-cols-2 gap-3 sm:col-span-2 xl:col-span-2">
          <FilterField label="Dal">
            <input
              className={fieldClassName}
              max={filters.to || reportingDate}
              onChange={(event) => update("from", event.target.value)}
              type="date"
              value={filters.from}
            />
          </FilterField>
          <FilterField label="Al">
            <input
              className={fieldClassName}
              max={reportingDate}
              min={filters.from || undefined}
              onChange={(event) => update("to", event.target.value)}
              type="date"
              value={filters.to}
            />
          </FilterField>
        </div>
      </div>
    </section>
  );
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
