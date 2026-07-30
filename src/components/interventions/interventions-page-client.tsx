"use client";

import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Siren,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { InterventionDetail } from "@/components/interventions/intervention-detail";
import {
  defaultInterventionFilters,
  InterventionFilters as InterventionFiltersBar,
  type InterventionFilterState,
} from "@/components/interventions/intervention-filters";
import { InterventionList } from "@/components/interventions/intervention-list";
import { ResolutionDialog } from "@/components/interventions/resolution-dialog";
import { useSetActiveInterventions } from "@/components/interventions/intervention-session-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Intervention } from "@/lib/domain";
import { formatLocalDate } from "@/lib/overview/formatters";
import type {
  InterventionDetail as InterventionDetailData,
  InterventionFilters as ServiceInterventionFilters,
} from "@/lib/services/dashboard-service";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";
import { cn } from "@/lib/utils";

interface QueueStats {
  active: number;
  urgent: number;
  inProgress: number;
  resolved: number;
}

interface Feedback {
  description: string;
  tone: "success" | "error";
  title: string;
}

const emptyStats: QueueStats = {
  active: 0,
  urgent: 0,
  inProgress: 0,
  resolved: 0,
};

const toServiceFilters = (
  filters: InterventionFilterState,
): ServiceInterventionFilters => ({
  statuses:
    filters.status === "active"
      ? ["open", "in_progress"]
      : filters.status === "all"
        ? undefined
        : [filters.status],
  priorities:
    filters.priority === "all" ? undefined : [filters.priority],
  sources: filters.source === "all" ? undefined : [filters.source],
  reasons: filters.reason === "all" ? undefined : [filters.reason],
  from: filters.from || undefined,
  to: filters.to || undefined,
});

const calculateStats = (interventions: Intervention[]): QueueStats => ({
  active: interventions.filter((item) =>
    ["open", "in_progress"].includes(item.status),
  ).length,
  urgent: interventions.filter(
    (item) =>
      ["open", "in_progress"].includes(item.status) &&
      item.priority === "urgent",
  ).length,
  inProgress: interventions.filter(
    (item) => item.status === "in_progress",
  ).length,
  resolved: interventions.filter((item) => item.status === "resolved").length,
});

interface InterventionsPageClientProps {
  initialInterventionId?: string;
}

export function InterventionsPageClient({
  initialInterventionId,
}: InterventionsPageClientProps) {
  const [filters, setFilters] = useState<InterventionFilterState>(() =>
    initialInterventionId
      ? { ...defaultInterventionFilters, status: "all" }
      : defaultInterventionFilters,
  );
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialInterventionId ?? null,
  );
  const [selectedDetail, setSelectedDetail] =
    useState<InterventionDetailData | null>(null);
  const [stats, setStats] = useState<QueueStats>(emptyStats);
  const [timeZone, setTimeZone] = useState("Europe/Rome");
  const [reportingDate, setReportingDate] = useState("");
  const [referenceTime, setReferenceTime] = useState("");
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const selectedIdRef = useRef<string | null>(initialInterventionId ?? null);
  const queueRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const resolutionDialogRef = useRef<HTMLDialogElement>(null);
  const initialLoadRef = useRef(true);
  const deepLinkRef = useRef(initialInterventionId);
  const setActiveInterventions = useSetActiveInterventions();

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const loadQueue = useCallback(
    async (
      nextFilters: InterventionFilterState,
      preferredId: string | null = selectedIdRef.current,
    ) => {
      const requestId = ++queueRequestRef.current;
      const initialLoad = initialLoadRef.current;

      if (initialLoad) {
        setLoadState("loading");
      } else {
        setIsRefreshing(true);
      }

      try {
        const [salon, date, filtered, all, active] = await Promise.all([
          dashboardService.getSalon(PILOT_SALON_ID),
          dashboardService.getReportingDate(PILOT_SALON_ID),
          dashboardService.listInterventions(
            PILOT_SALON_ID,
            toServiceFilters(nextFilters),
          ),
          dashboardService.listInterventions(PILOT_SALON_ID),
          dashboardService.listInterventions(PILOT_SALON_ID, {
            statuses: ["open", "in_progress"],
          }),
        ]);

        const nextSelectedId =
          filtered.find((item) => item.id === preferredId)?.id ??
          filtered[0]?.id ??
          null;
        const detail = nextSelectedId
          ? await dashboardService.getIntervention(
              PILOT_SALON_ID,
              nextSelectedId,
            )
          : null;

        if (requestId !== queueRequestRef.current) {
          return;
        }

        const fixtureReferenceTime = `${date}T12:00:00.000Z`;
        setInterventions(filtered);
        setSelectedId(nextSelectedId);
        setSelectedDetail(detail);
        setStats(calculateStats(all));
        setTimeZone(salon.timezone);
        setReportingDate(date);
        setReferenceTime(fixtureReferenceTime);
        setActiveInterventions?.(active);
        setLoadState("ready");
        initialLoadRef.current = false;

        if (
          initialLoad &&
          deepLinkRef.current === nextSelectedId &&
          !window.matchMedia("(min-width: 1280px)").matches
        ) {
          window.setTimeout(() => detailDialogRef.current?.showModal(), 0);
        }
        deepLinkRef.current = undefined;
      } catch {
        if (requestId === queueRequestRef.current) {
          setLoadState("error");
        }
      } finally {
        if (requestId === queueRequestRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [setActiveInterventions],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadQueue(filters);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [filters, loadQueue]);

  const selectIntervention = async (interventionId: string) => {
    const requestId = ++detailRequestRef.current;
    setSelectedId(interventionId);
    selectedIdRef.current = interventionId;

    try {
      const detail = await dashboardService.getIntervention(
        PILOT_SALON_ID,
        interventionId,
      );
      if (requestId !== detailRequestRef.current || detail === null) {
        return;
      }

      setSelectedDetail(detail);
      if (!window.matchMedia("(min-width: 1280px)").matches) {
        detailDialogRef.current?.showModal();
      }
    } catch {
      setFeedback({
        description:
          "Non è stato possibile caricare il dettaglio. Riprova dalla coda.",
        tone: "error",
        title: "Dettaglio non disponibile",
      });
    }
  };

  const performMutation = async (
    actionId: string,
    mutate: () => Promise<unknown>,
    success: Feedback,
    preferredId = selectedIdRef.current,
  ) => {
    setPendingAction(actionId);
    try {
      await mutate();
      await loadQueue(filters, preferredId);
      setFeedback(success);
      return true;
    } catch {
      setFeedback({
        description:
          "La simulazione non ha aggiornato la richiesta. Puoi riprovare senza conseguenze esterne.",
        tone: "error",
        title: "Azione non completata",
      });
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const markContactStarted = async (channel: "call" | "whatsapp") => {
    if (!selectedDetail) {
      return;
    }

    const intervention = selectedDetail.intervention;
    const channelLabel = channel === "call" ? "chiamata" : "WhatsApp";
    await performMutation(
      `contact-${channel}`,
      async () => {
        if (intervention.status === "open") {
          await dashboardService.markInterventionInProgress(
            PILOT_SALON_ID,
            intervention.id,
          );
        }
      },
      {
        description: `Azione ${channelLabel} registrata solo nella demo. La richiesta è ora in lavorazione.`,
        tone: "success",
        title: `Simulazione ${channelLabel} pronta`,
      },
      intervention.id,
    );
  };

  const markInProgress = async () => {
    if (!selectedDetail) {
      return;
    }
    const intervention = selectedDetail.intervention;

    await performMutation(
      "start",
      () =>
        dashboardService.markInterventionInProgress(
          PILOT_SALON_ID,
          intervention.id,
        ),
      {
        description:
          "La richiesta resta nella coda attiva ed è ora indicata come in lavorazione.",
        tone: "success",
        title: "Richiesta presa in carico",
      },
      intervention.id,
    );
  };

  const openResolutionDialog = () => {
    if (!selectedDetail) {
      return;
    }

    setResolutionNote("");
    resolutionDialogRef.current?.showModal();
  };

  const closeResolutionDialog = () => {
    if (!pendingAction && resolutionDialogRef.current?.open) {
      resolutionDialogRef.current.close();
      setResolutionNote("");
    }
  };

  const confirmResolution = async () => {
    if (!selectedDetail || resolutionNote.trim().length === 0) {
      return;
    }
    const intervention = selectedDetail.intervention;

    const resolved = await performMutation(
      "resolve",
      () =>
        dashboardService.resolveIntervention(
          PILOT_SALON_ID,
          intervention.id,
          { resolutionNote },
        ),
      {
        description:
          "La richiesta è uscita dalla coda attiva; conteggi e Panoramica sono stati aggiornati.",
        tone: "success",
        title: "Richiesta risolta",
      },
      intervention.id,
    );

    if (resolved) {
      resolutionDialogRef.current?.close();
      detailDialogRef.current?.close();
      setResolutionNote("");
    }
  };

  const reopenIntervention = async () => {
    if (!selectedDetail) {
      return;
    }
    const intervention = selectedDetail.intervention;

    await performMutation(
      "reopen",
      () =>
        dashboardService.reopenIntervention(
          PILOT_SALON_ID,
          intervention.id,
        ),
      {
        description:
          "La richiesta è tornata nella coda attiva e il conteggio è stato ripristinato.",
        tone: "success",
        title: "Richiesta riaperta",
      },
      intervention.id,
    );
  };

  const detailActions = {
    isPending: pendingAction !== null,
    onCall: () => void markContactStarted("call"),
    onOpenWhatsApp: () => void markContactStarted("whatsapp"),
    onReopen: () => void reopenIntervention(),
    onResolve: openResolutionDialog,
    onStart: () => void markInProgress(),
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="Da gestire · dati dimostrativi"
          description="Una sola coda per le richieste che la receptionist non deve completare da sola. Parti dalle priorità più alte, consulta ciò che è già stato raccolto e registra l’esito."
          title="Le eccezioni importanti, in ordine."
        />
        <p className="shrink-0 text-xs text-muted-foreground">
          {reportingDate
            ? `Dati demo fino al ${formatLocalDate(reportingDate)}`
            : "Caricamento data demo…"}
        </p>
      </div>

      {loadState === "loading" ? <InterventionsLoadingState /> : null}

      {loadState === "error" ? (
        <ErrorState
          description="La coda dimostrativa non è stata caricata. Nessuna azione esterna è stata eseguita."
          onRetry={() => void loadQueue(filters)}
          title="Coda non disponibile"
        />
      ) : null}

      {loadState === "ready" ? (
        <>
          <QueueSummary stats={stats} />

          <InterventionFiltersBar
            filters={filters}
            isRefreshing={isRefreshing}
            onChange={setFilters}
            onReset={() => setFilters(defaultInterventionFilters)}
            reportingDate={reportingDate}
            resultCount={interventions.length}
          />

          <div
            aria-busy={isRefreshing}
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] xl:items-start"
          >
            <div
              className={cn(
                "min-w-0 transition-opacity",
                isRefreshing && "opacity-65",
              )}
            >
              <InterventionList
                interventions={interventions}
                onResetFilters={() =>
                  setFilters(defaultInterventionFilters)
                }
                onSelect={(id) => void selectIntervention(id)}
                referenceTime={referenceTime}
                selectedId={selectedId}
                timeZone={timeZone}
              />
            </div>

            <aside
              aria-label="Dettaglio intervento selezionato"
              className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] min-w-0 overflow-y-auto rounded-2xl overscroll-contain xl:block"
            >
              {selectedDetail ? (
                <InterventionDetail
                  detail={selectedDetail}
                  referenceTime={referenceTime}
                  timeZone={timeZone}
                  {...detailActions}
                />
              ) : (
                <EmptyState
                  className="min-h-96 bg-card"
                  description="Seleziona una richiesta dalla coda per vedere cliente, dati raccolti, collegamenti e azioni disponibili."
                  eyebrow="Dettaglio"
                  title="Nessuna richiesta selezionata"
                />
              )}
            </aside>
          </div>
        </>
      ) : null}

      <dialog
        aria-label="Dettaglio intervento"
        className="fixed inset-x-0 bottom-0 m-0 ml-0 w-full max-w-none border-0 bg-transparent p-0 text-foreground focus:outline-none xl:hidden"
        onCancel={(event) => {
          event.preventDefault();
          if (!pendingAction) {
            detailDialogRef.current?.close();
          }
        }}
        ref={detailDialogRef}
      >
        {selectedDetail ? (
          <InterventionDetail
            detail={selectedDetail}
            isDialog
            onClose={() => detailDialogRef.current?.close()}
            referenceTime={referenceTime}
            timeZone={timeZone}
            {...detailActions}
          />
        ) : null}
      </dialog>

      <ResolutionDialog
        dialogRef={resolutionDialogRef}
        isPending={pendingAction === "resolve"}
        note={resolutionNote}
        onCancel={closeResolutionDialog}
        onConfirm={() => void confirmResolution()}
        onNoteChange={setResolutionNote}
        targetTitle={selectedDetail?.intervention.title ?? "questa richiesta"}
      />

      {feedback ? (
        <div
          aria-live={feedback.tone === "error" ? "assertive" : "polite"}
          className={cn(
            "fixed right-4 bottom-4 z-50 flex w-[min(calc(100%_-_2rem),26rem)] items-start gap-3 rounded-2xl border bg-card p-4 shadow-2xl sm:right-6 sm:bottom-6",
            feedback.tone === "success"
              ? "border-success/25"
              : "border-destructive/25",
          )}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              feedback.tone === "success"
                ? "bg-success/12 text-success"
                : "bg-destructive/12 text-destructive",
            )}
          >
            {feedback.tone === "success" ? (
              <CheckCircle2 aria-hidden="true" className="size-4.5" />
            ) : (
              <CircleAlert aria-hidden="true" className="size-4.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{feedback.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {feedback.description}
            </p>
          </div>
          <Button
            aria-label="Chiudi notifica"
            className="size-8 rounded-lg"
            onClick={() => setFeedback(null)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function QueueSummary({ stats }: { stats: QueueStats }) {
  const items: Array<{
    icon: LucideIcon;
    label: string;
    tone: string;
    value: number;
  }> = [
    {
      icon: CircleAlert,
      label: "Richieste attive",
      tone: "bg-primary/11 text-primary",
      value: stats.active,
    },
    {
      icon: Siren,
      label: "Urgenti",
      tone: "bg-destructive/12 text-destructive",
      value: stats.urgent,
    },
    {
      icon: Clock3,
      label: "In lavorazione",
      tone: "bg-warning/16 text-warning-foreground dark:text-warning",
      value: stats.inProgress,
    },
    {
      icon: CheckCircle2,
      label: "Risolte",
      tone: "bg-success/12 text-success",
      value: stats.resolved,
    },
  ];

  return (
    <section
      aria-label="Riepilogo coda"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {items.map(({ icon: Icon, label, tone, value }) => (
        <Card className="overflow-hidden" key={label}>
          <CardContent className="flex items-center gap-3 p-4 sm:p-5">
            <div
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-2xl",
                tone,
              )}
            >
              <Icon aria-hidden="true" className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-[-0.04em]">{value}</p>
              <p className="text-[0.7rem] leading-4 text-muted-foreground sm:text-xs">
                {label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function InterventionsLoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Caricamento coda interventi"
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-24 rounded-2xl" key={index} />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-44 rounded-2xl" key={index} />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="hidden h-[42rem] rounded-2xl xl:block" />
      </div>
    </div>
  );
}
