"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CallDetail } from "@/components/calls/call-detail";
import {
  CallFilters,
  defaultCallFilters,
  type CallFilterState,
} from "@/components/calls/call-filters";
import { CallList } from "@/components/calls/call-list";
import { CallSummary } from "@/components/calls/call-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLocalDate } from "@/lib/overview/formatters";
import type {
  CallDetail as CallDetailData,
  CallHistoryPage,
  CallHistoryQuery,
} from "@/lib/services/dashboard-service";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";
import { cn } from "@/lib/utils";

interface CallsPageClientProps {
  initialCallId?: string;
}

const emptyHistory: CallHistoryPage = {
  items: [],
  page: 1,
  pageSize: 5,
  totalItems: 0,
  totalPages: 1,
  summary: {
    totalCalls: 0,
    averageDurationSeconds: 0,
    completedAutomatically: 0,
    needsAttention: 0,
    outcomeCounts: {
      booking_completed: 0,
      information_provided: 0,
      change_or_cancellation: 0,
      transferred: 0,
      incomplete: 0,
      technical_error: 0,
      abandoned: 0,
    },
  },
};

const toServiceQuery = (
  filters: CallFilterState,
  page: number,
): CallHistoryQuery => ({
  outcomes: filters.outcome === "all" ? undefined : [filters.outcome],
  from: filters.from || undefined,
  to: filters.to || undefined,
  page,
  pageSize: 5,
});

export function CallsPageClient({ initialCallId }: CallsPageClientProps) {
  const [filters, setFilters] =
    useState<CallFilterState>(defaultCallFilters);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<CallHistoryPage>(emptyHistory);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCallId ?? null,
  );
  const [selectedDetail, setSelectedDetail] =
    useState<CallDetailData | null>(null);
  const [timeZone, setTimeZone] = useState("Europe/Rome");
  const [reportingDate, setReportingDate] = useState("");
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedIdRef = useRef<string | null>(initialCallId ?? null);
  const historyRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const initialLoadRef = useRef(true);
  const deepLinkRef = useRef(initialCallId);
  const detailDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadHistory = useCallback(
    async (nextFilters: CallFilterState, nextPage: number) => {
      const requestId = ++historyRequestRef.current;
      const initialLoad = initialLoadRef.current;

      if (initialLoad) {
        setLoadState("loading");
      } else {
        setIsRefreshing(true);
      }

      try {
        const [salon, date, nextHistory] = await Promise.all([
          dashboardService.getSalon(PILOT_SALON_ID),
          dashboardService.getReportingDate(PILOT_SALON_ID),
          dashboardService.listCallHistory(
            PILOT_SALON_ID,
            toServiceQuery(nextFilters, nextPage),
          ),
        ]);

        const deepLinkedId = deepLinkRef.current;
        const visibleSelectedId =
          nextHistory.items.find(
            (item) => item.call.id === selectedIdRef.current,
          )?.call.id ??
          nextHistory.items[0]?.call.id ??
          null;
        const nextSelectedId =
          initialLoad && deepLinkedId ? deepLinkedId : visibleSelectedId;
        const detail = nextSelectedId
          ? await dashboardService.getCall(PILOT_SALON_ID, nextSelectedId)
          : null;
        const fallbackSelectedId =
          detail?.call.id ??
          nextHistory.items[0]?.call.id ??
          null;
        const fallbackDetail =
          detail ??
          (fallbackSelectedId
            ? await dashboardService.getCall(
                PILOT_SALON_ID,
                fallbackSelectedId,
              )
            : null);

        if (requestId !== historyRequestRef.current) {
          return;
        }

        setHistory(nextHistory);
        setPage(nextHistory.page);
        setSelectedId(fallbackSelectedId);
        setSelectedDetail(fallbackDetail);
        setTimeZone(salon.timezone);
        setReportingDate(date);
        setLoadState("ready");
        initialLoadRef.current = false;
        deepLinkRef.current = undefined;

        if (
          initialLoad &&
          deepLinkedId &&
          fallbackDetail?.call.id === deepLinkedId &&
          !window.matchMedia("(min-width: 1280px)").matches
        ) {
          window.setTimeout(() => detailDialogRef.current?.showModal(), 0);
        }
      } catch {
        if (requestId === historyRequestRef.current) {
          setLoadState("error");
        }
      } finally {
        if (requestId === historyRequestRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadHistory(filters, page);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [filters, loadHistory, page]);

  const selectCall = async (callId: string) => {
    const requestId = ++detailRequestRef.current;
    setSelectedId(callId);
    selectedIdRef.current = callId;

    try {
      const detail = await dashboardService.getCall(
        PILOT_SALON_ID,
        callId,
      );
      if (requestId !== detailRequestRef.current || detail === null) {
        return;
      }

      setSelectedDetail(detail);
      if (!window.matchMedia("(min-width: 1280px)").matches) {
        detailDialogRef.current?.showModal();
      }
    } catch {
      setLoadState("error");
    }
  };

  const changeFilters = (nextFilters: CallFilterState) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(defaultCallFilters);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="Chiamate · Vapi · dati dimostrativi"
          description="Consulta ciò che la receptionist ha gestito, individua gli esiti da verificare e apri soltanto i dettagli che servono, senza registrazioni audio."
          title="Ogni chiamata, spiegata in modo semplice."
        />
        <p className="shrink-0 text-xs text-muted-foreground">
          {reportingDate
            ? `Dati demo fino al ${formatLocalDate(reportingDate)}`
            : "Caricamento data demo…"}
        </p>
      </div>

      {loadState === "loading" ? <CallsLoadingState /> : null}

      {loadState === "error" ? (
        <ErrorState
          description="Lo storico dimostrativo non è stato caricato. Nessun provider esterno è stato contattato."
          onRetry={() => void loadHistory(filters, page)}
          title="Chiamate non disponibili"
        />
      ) : null}

      {loadState === "ready" ? (
        <>
          <CallSummary summary={history.summary} />

          <CallFilters
            filters={filters}
            isRefreshing={isRefreshing}
            onChange={changeFilters}
            onReset={resetFilters}
            reportingDate={reportingDate}
            resultCount={history.totalItems}
          />

          <div
            aria-busy={isRefreshing}
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)] xl:items-start"
          >
            <div
              className={cn(
                "min-w-0 transition-opacity",
                isRefreshing && "opacity-65",
              )}
            >
              <CallList
                items={history.items}
                onPageChange={setPage}
                onResetFilters={resetFilters}
                onSelect={(id) => void selectCall(id)}
                page={history.page}
                selectedId={selectedId}
                timeZone={timeZone}
                totalItems={history.totalItems}
                totalPages={history.totalPages}
              />
            </div>

            <aside
              aria-label="Dettaglio chiamata selezionata"
              className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] min-w-0 overflow-y-auto rounded-2xl overscroll-contain xl:block"
            >
              {selectedDetail ? (
                <CallDetail detail={selectedDetail} timeZone={timeZone} />
              ) : (
                <EmptyState
                  className="min-h-96 bg-card"
                  description="Seleziona una chiamata per vedere cliente, esito, appuntamento, intervento e trascrizione disponibile."
                  eyebrow="Dettaglio"
                  title="Nessuna chiamata selezionata"
                />
              )}
            </aside>
          </div>
        </>
      ) : null}

      <dialog
        aria-label="Dettaglio chiamata"
        className="fixed inset-x-0 bottom-0 m-0 ml-0 w-full max-w-none border-0 bg-transparent p-0 text-foreground focus:outline-none xl:hidden"
        onCancel={(event) => {
          event.preventDefault();
          detailDialogRef.current?.close();
        }}
        ref={detailDialogRef}
      >
        {selectedDetail ? (
          <CallDetail
            detail={selectedDetail}
            isDialog
            onClose={() => detailDialogRef.current?.close()}
            timeZone={timeZone}
          />
        ) : null}
      </dialog>
    </div>
  );
}

function CallsLoadingState() {
  return (
    <div aria-label="Caricamento chiamate" className="space-y-5" role="status">
      <span className="sr-only">Caricamento dello storico chiamate…</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <Skeleton className="size-10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-3 w-24 max-w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-36 rounded-2xl" key={index} />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="hidden h-[36rem] rounded-2xl xl:block" />
      </div>
    </div>
  );
}
