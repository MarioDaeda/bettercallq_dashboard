"use client";

import {
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSetActiveInterventions } from "@/components/interventions/intervention-session-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConversationActionDialog,
  type ConversationAction,
} from "@/components/whatsapp/conversation-action-dialog";
import { ConversationDetail } from "@/components/whatsapp/conversation-detail";
import {
  ConversationFilters,
  defaultConversationFilters,
  type ConversationFilterState,
} from "@/components/whatsapp/conversation-filters";
import { ConversationList } from "@/components/whatsapp/conversation-list";
import { ConversationSummary } from "@/components/whatsapp/conversation-summary";
import { formatLocalDate } from "@/lib/overview/formatters";
import type {
  ConversationDetail as ConversationDetailData,
  ConversationFilters as ServiceConversationFilters,
  ConversationInbox,
} from "@/lib/services/dashboard-service";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";
import { cn } from "@/lib/utils";

interface WhatsAppPageClientProps {
  initialConversationId?: string;
}

interface Feedback {
  description: string;
  tone: "success" | "error";
  title: string;
}

const emptyInbox: ConversationInbox = {
  items: [],
  totalItems: 0,
  summary: {
    totalConversations: 0,
    needsIntervention: 0,
    humanControlled: 0,
    waitingCustomer: 0,
    completed: 0,
    statusCounts: {
      ai_handled: 0,
      needs_intervention: 0,
      human_control: 0,
      waiting_customer: 0,
      completed: 0,
    },
  },
};

const toServiceFilters = (
  filters: ConversationFilterState,
): ServiceConversationFilters => ({
  statuses: filters.status === "all" ? undefined : [filters.status],
  query: filters.query || undefined,
});

export function WhatsAppPageClient({
  initialConversationId,
}: WhatsAppPageClientProps) {
  const [filters, setFilters] = useState<ConversationFilterState>(
    defaultConversationFilters,
  );
  const [inbox, setInbox] = useState<ConversationInbox>(emptyInbox);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [selectedDetail, setSelectedDetail] =
    useState<ConversationDetailData | null>(null);
  const [draft, setDraft] = useState("");
  const [timeZone, setTimeZone] = useState("Europe/Rome");
  const [reportingDate, setReportingDate] = useState("");
  const [referenceTime, setReferenceTime] = useState("");
  const [channelMessage, setChannelMessage] = useState(
    "WhatsApp verrà collegato in una fase successiva.",
  );
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [dialogAction, setDialogAction] =
    useState<ConversationAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const selectedIdRef = useRef<string | null>(
    initialConversationId ?? null,
  );
  const inboxRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const initialLoadRef = useRef(true);
  const deepLinkRef = useRef(initialConversationId);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const actionDialogRef = useRef<HTMLDialogElement>(null);
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

  const loadInbox = useCallback(
    async (
      nextFilters: ConversationFilterState,
      preferredId: string | null = selectedIdRef.current,
    ) => {
      const requestId = ++inboxRequestRef.current;
      const initialLoad = initialLoadRef.current;

      if (initialLoad) {
        setLoadState("loading");
      } else {
        setIsRefreshing(true);
      }

      try {
        const [salon, date, nextInbox, channels, active] =
          await Promise.all([
            dashboardService.getSalon(PILOT_SALON_ID),
            dashboardService.getReportingDate(PILOT_SALON_ID),
            dashboardService.listConversationInbox(
              PILOT_SALON_ID,
              toServiceFilters(nextFilters),
            ),
            dashboardService.getChannelStatuses(PILOT_SALON_ID),
            dashboardService.listInterventions(PILOT_SALON_ID, {
              statuses: ["open", "in_progress"],
            }),
          ]);

        const deepLinkedId = deepLinkRef.current;
        const visiblePreferredId =
          nextInbox.items.find(
            (item) => item.conversation.id === preferredId,
          )?.conversation.id ?? null;
        const nextSelectedId =
          initialLoad && deepLinkedId
            ? deepLinkedId
            : visiblePreferredId ??
              nextInbox.items[0]?.conversation.id ??
              null;
        const detail = nextSelectedId
          ? await dashboardService.getConversation(
              PILOT_SALON_ID,
              nextSelectedId,
            )
          : null;
        const fallbackSelectedId =
          detail?.conversation.id ??
          nextInbox.items[0]?.conversation.id ??
          null;
        const fallbackDetail =
          detail ??
          (fallbackSelectedId
            ? await dashboardService.getConversation(
                PILOT_SALON_ID,
                fallbackSelectedId,
              )
            : null);

        if (requestId !== inboxRequestRef.current) {
          return;
        }

        setInbox(nextInbox);
        setSelectedId(fallbackSelectedId);
        setSelectedDetail(fallbackDetail);
        setTimeZone(salon.timezone);
        setReportingDate(date);
        setReferenceTime(`${date}T12:00:00.000Z`);
        setChannelMessage(
          channels.find((channel) => channel.channel === "whatsapp")
            ?.message ?? "Canale WhatsApp dimostrativo.",
        );
        setActiveInterventions?.(active);
        setLoadState("ready");
        initialLoadRef.current = false;
        deepLinkRef.current = undefined;

        if (
          initialLoad &&
          deepLinkedId &&
          fallbackDetail?.conversation.id === deepLinkedId &&
          !window.matchMedia("(min-width: 1280px)").matches
        ) {
          window.setTimeout(() => detailDialogRef.current?.showModal(), 0);
        }
      } catch {
        if (requestId === inboxRequestRef.current) {
          setLoadState("error");
        }
      } finally {
        if (requestId === inboxRequestRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [setActiveInterventions],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadInbox(filters);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [filters, loadInbox]);

  const selectConversation = async (conversationId: string) => {
    const requestId = ++detailRequestRef.current;
    setSelectedId(conversationId);
    selectedIdRef.current = conversationId;
    setDraft("");

    try {
      const detail = await dashboardService.getConversation(
        PILOT_SALON_ID,
        conversationId,
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
          "Non è stato possibile caricare il dettaglio. Riprova dalla inbox.",
        tone: "error",
        title: "Conversazione non disponibile",
      });
    }
  };

  const performMutation = async (
    actionId: string,
    mutate: () => Promise<unknown>,
    success: Feedback,
  ) => {
    setPendingAction(actionId);
    try {
      await mutate();
      await loadInbox(filters, selectedIdRef.current);
      setFeedback(success);
      return true;
    } catch {
      setFeedback({
        description:
          "La simulazione non ha aggiornato la conversazione. Puoi riprovare senza conseguenze esterne.",
        tone: "error",
        title: "Azione non completata",
      });
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const openActionDialog = (action: ConversationAction) => {
    setDialogAction(action);
    actionDialogRef.current?.showModal();
  };

  const closeActionDialog = () => {
    if (!pendingAction && actionDialogRef.current?.open) {
      actionDialogRef.current.close();
      setDialogAction(null);
    }
  };

  const confirmAction = async () => {
    if (!selectedDetail || !dialogAction) {
      return;
    }
    const conversationId = selectedDetail.conversation.id;
    const actions = {
      take: {
        mutate: () =>
          dashboardService.takeConversationControl(
            PILOT_SALON_ID,
            conversationId,
          ),
        feedback: {
          description:
            "Il salone può ora rispondere manualmente; l’IA è sospesa per questa conversazione.",
          tone: "success",
          title: "Controllo del salone attivo",
        },
      },
      release: {
        mutate: () =>
          dashboardService.releaseConversationControl(
            PILOT_SALON_ID,
            conversationId,
          ),
        feedback: {
          description:
            "La receptionist può riprendere le risposte. L’eventuale intervento collegato è stato risolto.",
          tone: "success",
          title: "Conversazione restituita all’IA",
        },
      },
      complete: {
        mutate: () =>
          dashboardService.completeConversation(
            PILOT_SALON_ID,
            conversationId,
          ),
        feedback: {
          description:
            "La conversazione è chiusa nella demo e non accetta altri messaggi.",
          tone: "success",
          title: "Conversazione completata",
        },
      },
    } satisfies Record<
      ConversationAction,
      { mutate: () => Promise<unknown>; feedback: Feedback }
    >;
    const selectedAction = dialogAction;
    const succeeded = await performMutation(
      selectedAction,
      actions[selectedAction].mutate,
      actions[selectedAction].feedback,
    );

    if (succeeded) {
      if (selectedAction !== "take") {
        setDraft("");
      }
      actionDialogRef.current?.close();
      setDialogAction(null);
    }
  };

  const sendMessage = async () => {
    if (!selectedDetail || draft.trim().length === 0) {
      return;
    }
    const message = draft;
    const succeeded = await performMutation(
      "send",
      () =>
        dashboardService.sendManualMessage(
          PILOT_SALON_ID,
          selectedDetail.conversation.id,
          { body: message },
        ),
      {
        description:
          "Il messaggio è stato aggiunto alla cronologia locale. Nessuna chiamata Meta è stata effettuata.",
        tone: "success",
        title: "Messaggio inviato nella demo",
      },
    );

    if (succeeded) {
      setDraft("");
    }
  };

  const resetFilters = () => setFilters(defaultConversationFilters);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="WhatsApp · inbox dimostrativa"
          description="Segui le richieste dei clienti, passa dal controllo dell’IA a quello del salone senza sovrapposizioni e rispondi manualmente soltanto quando serve."
          title="Una sola voce alla volta, sempre sotto controllo."
        />
        <p className="shrink-0 text-xs text-muted-foreground">
          {reportingDate
            ? `Dati demo fino al ${formatLocalDate(reportingDate)}`
            : "Caricamento data demo…"}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/[0.055] p-4">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-4.5 shrink-0 text-info"
        />
        <div>
          <p className="text-sm font-semibold">Meta Cloud API non collegata</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {channelMessage} Tutte le azioni di questa pagina restano nella
            sessione e non raggiungono clienti reali.
          </p>
        </div>
      </div>

      {loadState === "loading" ? <WhatsAppLoadingState /> : null}

      {loadState === "error" ? (
        <ErrorState
          description="La inbox dimostrativa non è stata caricata. Nessun provider esterno è stato contattato."
          onRetry={() => void loadInbox(filters)}
          title="Conversazioni non disponibili"
        />
      ) : null}

      {loadState === "ready" ? (
        <>
          <ConversationSummary summary={inbox.summary} />

          <ConversationFilters
            filters={filters}
            isRefreshing={isRefreshing}
            onChange={setFilters}
            onReset={resetFilters}
            resultCount={inbox.totalItems}
          />

          <div
            aria-busy={isRefreshing}
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(21rem,0.72fr)_minmax(29rem,1.28fr)] xl:items-start"
          >
            <div
              className={cn(
                "min-w-0 transition-opacity",
                isRefreshing && "opacity-65",
              )}
            >
              <ConversationList
                items={inbox.items}
                onResetFilters={resetFilters}
                onSelect={(id) => void selectConversation(id)}
                referenceTime={referenceTime}
                selectedId={selectedId}
                totalItems={inbox.totalItems}
              />
            </div>

            <aside
              aria-label="Dettaglio conversazione selezionata"
              className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] min-w-0 overflow-y-auto rounded-2xl overscroll-contain xl:block"
            >
              {selectedDetail ? (
                <ConversationDetail
                  detail={selectedDetail}
                  draft={draft}
                  onDraftChange={setDraft}
                  onRequestAction={openActionDialog}
                  onSend={() => void sendMessage()}
                  pendingAction={pendingAction}
                  timeZone={timeZone}
                />
              ) : (
                <EmptyState
                  className="min-h-96 bg-card"
                  description="Seleziona una conversazione per leggere la cronologia, verificare i riferimenti e gestire il controllo."
                  eyebrow="Dettaglio"
                  title="Nessuna conversazione selezionata"
                />
              )}
            </aside>
          </div>
        </>
      ) : null}

      <dialog
        aria-label="Dettaglio conversazione WhatsApp"
        className="fixed inset-x-0 bottom-0 m-0 ml-0 w-full max-w-none border-0 bg-transparent p-0 text-foreground focus:outline-none xl:hidden"
        onCancel={(event) => {
          event.preventDefault();
          detailDialogRef.current?.close();
        }}
        ref={detailDialogRef}
      >
        {selectedDetail ? (
          <ConversationDetail
            detail={selectedDetail}
            draft={draft}
            isDialog
            onClose={() => detailDialogRef.current?.close()}
            onDraftChange={setDraft}
            onRequestAction={openActionDialog}
            onSend={() => void sendMessage()}
            pendingAction={pendingAction}
            timeZone={timeZone}
          />
        ) : null}
      </dialog>

      <ConversationActionDialog
        action={dialogAction}
        customerName={
          selectedDetail?.conversation.customerName ??
          "Cliente non identificato"
        }
        dialogRef={actionDialogRef}
        isPending={pendingAction !== null}
        onCancel={closeActionDialog}
        onConfirm={() => void confirmAction()}
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

function WhatsAppLoadingState() {
  return (
    <div
      aria-label="Caricamento conversazioni WhatsApp"
      className="space-y-5"
      role="status"
    >
      <span className="sr-only">Caricamento della inbox WhatsApp…</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <Skeleton className="size-10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24 max-w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(21rem,0.72fr)_minmax(29rem,1.28fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-36 rounded-2xl" key={index} />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="hidden h-[42rem] rounded-2xl xl:block" />
      </div>
    </div>
  );
}
