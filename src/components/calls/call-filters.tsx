"use client";

import { CalendarRange, Funnel, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CallOutcome } from "@/lib/domain";
import {
  callPeriodLabels,
  callPeriods,
  resolveCallRange,
} from "@/lib/calls/date-range";
import { callOutcomeLabels } from "@/lib/calls/labels";
import { cn } from "@/lib/utils";

export interface CallFilterState {
  outcome: "all" | CallOutcome;
  from: string;
  to: string;
}

export const defaultCallFilters: CallFilterState = {
  outcome: "all",
  from: "",
  to: "",
};

interface CallFiltersProps {
  filters: CallFilterState;
  isRefreshing: boolean;
  onChange: (filters: CallFilterState) => void;
  onReset: () => void;
  reportingDate: string;
  resultCount: number;
}

const fieldClassName =
  "h-10 min-w-0 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const outcomes = Object.keys(callOutcomeLabels) as CallOutcome[];

export function CallFilters({
  filters,
  isRefreshing,
  onChange,
  onReset,
  reportingDate,
  resultCount,
}: CallFiltersProps) {
  const hasFilters =
    filters.outcome !== "all" || filters.from !== "" || filters.to !== "";

  const update = <Key extends keyof CallFilterState>(
    key: Key,
    value: CallFilterState[Key],
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

  const applyPeriod = (period: (typeof callPeriods)[number]) => {
    const range = resolveCallRange(reportingDate, period);
    onChange({
      ...filters,
      from: range?.from ?? "",
      to: range?.to ?? "",
    });
  };

  const isActivePeriod = (period: (typeof callPeriods)[number]) => {
    if (!reportingDate) {
      return (
        period === "all" && filters.from === "" && filters.to === ""
      );
    }

    const range = resolveCallRange(reportingDate, period);
    return range === null
      ? filters.from === "" && filters.to === ""
      : filters.from === range.from && filters.to === range.to;
  };

  return (
    <section
      aria-label="Filtri dello storico chiamate"
      className="rounded-2xl border bg-card p-4 shadow-[0_1px_2px_oklch(0.18_0.03_278/0.04)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Funnel aria-hidden="true" className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Filtra lo storico</h2>
              {hasFilters ? (
                <Badge variant="secondary">Filtri attivi</Badge>
              ) : null}
            </div>
            <p
              aria-live="polite"
              className="mt-0.5 text-xs text-muted-foreground"
            >
              {isRefreshing
                ? "Aggiornamento risultati…"
                : `${resultCount} ${resultCount === 1 ? "chiamata" : "chiamate"}`}
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
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Azzera
        </Button>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[1.15fr_1fr] xl:items-end">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarRange aria-hidden="true" className="size-3.5" />
            Periodo rapido
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {callPeriods.map((period) => (
              <Button
                aria-pressed={isActivePeriod(period)}
                className="min-w-0"
                disabled={!reportingDate || isRefreshing}
                key={period}
                onClick={() => applyPeriod(period)}
                size="sm"
                type="button"
                variant={isActivePeriod(period) ? "secondary" : "outline"}
              >
                {callPeriodLabels[period]}
              </Button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "grid min-w-0 gap-3 sm:grid-cols-3",
            isRefreshing && "opacity-80",
          )}
        >
          <FilterField label="Esito">
            <select
              className={fieldClassName}
              onChange={(event) =>
                update(
                  "outcome",
                  event.target.value as CallFilterState["outcome"],
                )
              }
              value={filters.outcome}
            >
              <option value="all">Tutti gli esiti</option>
              {outcomes.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {callOutcomeLabels[outcome]}
                </option>
              ))}
            </select>
          </FilterField>

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
