"use client";

import type { ZodIssue } from "zod";
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BehaviorSettings } from "@/components/settings/behavior-settings";
import { EscalationSettings } from "@/components/settings/escalation-settings";
import { FaqSettings } from "@/components/settings/faq-settings";
import { SalonProfileSettings } from "@/components/settings/salon-profile-settings";
import { ScheduleSettings } from "@/components/settings/schedule-settings";
import { ServicesSettings } from "@/components/settings/services-settings";
import { SettingsSectionNav } from "@/components/settings/settings-section-nav";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  updateReceptionistSettingsInputSchema,
  type ReceptionistSettings,
  type Salon,
  type UpdateReceptionistSettingsInput,
} from "@/lib/domain";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";
import {
  formatIssuePath,
  getIssueSection,
  settingsInputsEqual,
  settingsSectionLabels,
  toSettingsInput,
  type SettingsSection,
} from "@/lib/settings/settings";
import { cn } from "@/lib/utils";

interface Feedback {
  description: string;
  tone: "success" | "error" | "neutral";
  title: string;
}

export function AiSettingsPageClient() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [metadata, setMetadata] =
    useState<ReceptionistSettings | null>(null);
  const [draft, setDraft] =
    useState<UpdateReceptionistSettingsInput | null>(null);
  const [savedInput, setSavedInput] =
    useState<UpdateReceptionistSettingsInput | null>(null);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [bookingProviderConfigured, setBookingProviderConfigured] =
    useState(false);
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const requestRef = useRef(0);
  const hasUnsavedChangesRef = useRef(false);
  const validationSummaryRef = useRef<HTMLDivElement>(null);

  const loadSettings = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoadState("loading");

    try {
      const [nextSalon, settings, channels] = await Promise.all([
        dashboardService.getSalon(PILOT_SALON_ID),
        dashboardService.getReceptionistSettings(PILOT_SALON_ID),
        dashboardService.getChannelStatuses(PILOT_SALON_ID),
      ]);

      if (requestId !== requestRef.current) {
        return;
      }

      const input = toSettingsInput(settings);
      const bookingChannel = channels.find(
        (channel) => channel.channel === "booking_provider",
      );

      setSalon(nextSalon);
      setMetadata(settings);
      setDraft(input);
      setSavedInput(structuredClone(input));
      setBookingProviderConfigured(
        bookingChannel?.status === "operational" &&
          Boolean(bookingChannel.capability?.createBooking),
      );
      setShowValidation(false);
      setFeedback(null);
      setLoadState("ready");
    } catch {
      if (requestId === requestRef.current) {
        setLoadState("error");
      }
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadSettings]);

  const validation = useMemo(
    () =>
      draft
        ? updateReceptionistSettingsInputSchema.safeParse(draft)
        : null,
    [draft],
  );
  const validationIssues = useMemo(
    () =>
      showValidation && validation && !validation.success
        ? validation.error.issues
        : [],
    [showValidation, validation],
  );
  const hasUnsavedChanges = Boolean(
    draft &&
      savedInput &&
      !settingsInputsEqual(draft, savedInput),
  );

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const message =
      "Hai modifiche non salvate nelle Impostazioni IA. Vuoi uscire e perderle?";
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleInternalNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest("a[href]") : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank"
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const isInternalDestination =
        destination.origin === current.origin &&
        `${destination.pathname}${destination.search}` !==
          `${current.pathname}${current.search}`;

      if (
        isInternalDestination &&
        hasUnsavedChangesRef.current &&
        !window.confirm(message)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleInternalNavigation, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener(
        "click",
        handleInternalNavigation,
        true,
      );
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 5_500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const errorCounts = useMemo(
    () =>
      validationIssues.reduce<
        Partial<Record<SettingsSection, number>>
      >((counts, issue) => {
        const section = getIssueSection(issue);
        counts[section] = (counts[section] ?? 0) + 1;
        return counts;
      }, {}),
    [validationIssues],
  );

  const saveSettings = async () => {
    if (!draft || !validation) {
      return;
    }

    if (!validation.success) {
      setShowValidation(true);
      const firstSection = getIssueSection(validation.error.issues[0]);
      setActiveSection(firstSection);
      setFeedback({
        description:
          "Controlla i campi evidenziati prima di salvare la configurazione.",
        tone: "error",
        title: "Impostazioni da correggere",
      });
      window.setTimeout(
        () => validationSummaryRef.current?.focus(),
        0,
      );
      return;
    }

    setIsSaving(true);
    try {
      const saved = await dashboardService.updateReceptionistSettings(
        PILOT_SALON_ID,
        validation.data,
      );
      const nextInput = toSettingsInput(saved);

      setMetadata(saved);
      setDraft(nextInput);
      setSavedInput(structuredClone(nextInput));
      setShowValidation(false);
      setFeedback({
        description:
          "Le modifiche sono disponibili nella sessione demo. Il prompt Vapi non è stato aggiornato.",
        tone: "success",
        title: `Configurazione v${saved.version} salvata`,
      });
    } catch {
      setFeedback({
        description:
          "Il service mock non ha accettato le modifiche. Nessun sistema esterno è stato contattato.",
        tone: "error",
        title: "Salvataggio non riuscito",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    if (!savedInput || !hasUnsavedChanges) {
      return;
    }

    if (
      !window.confirm(
        "Vuoi annullare tutte le modifiche non salvate in questa pagina?",
      )
    ) {
      return;
    }

    setDraft(structuredClone(savedInput));
    setShowValidation(false);
    setFeedback({
      description:
        "I campi mostrano di nuovo l’ultima versione salvata nella sessione.",
      tone: "neutral",
      title: "Modifiche annullate",
    });
  };

  if (loadState === "loading") {
    return <SettingsLoadingState />;
  }

  if (loadState === "error") {
    return (
      <div className="space-y-7">
        <PageHeader
          badge="Impostazioni IA"
          description="Configura le informazioni strutturate usate dalla receptionist."
          title="La receptionist segue le regole del tuo salone."
        />
        <ErrorState
          description="Le impostazioni dimostrative non sono state caricate. Nessun provider esterno è stato contattato."
          onRetry={() => void loadSettings()}
          title="Impostazioni non disponibili"
        />
      </div>
    );
  }

  if (!salon || !metadata || !draft) {
    return null;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="Impostazioni IA · dati strutturati"
          description="Configura ciò che la receptionist può dire e quando deve fermarsi. Non devi modificare prompt tecnici."
          title="La receptionist segue le regole del tuo salone."
        />
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Badge
            variant={hasUnsavedChanges ? "warning" : "success"}
          >
            {hasUnsavedChanges
              ? "Modifiche non salvate"
              : `Versione ${metadata.version} salvata`}
          </Badge>
          <Button
            disabled={isSaving || !hasUnsavedChanges}
            onClick={() => void saveSettings()}
            size="lg"
            type="button"
          >
            {isSaving ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <Save aria-hidden="true" data-icon="inline-start" />
            )}
            {isSaving ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex gap-3 rounded-2xl border border-success/20 bg-success/[0.055] p-4">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-success"
          />
          <div>
            <p className="text-sm font-semibold">
              Configurazione BetterCallQ
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Il salvataggio resta nel service mock e viene ripristinato
              ricaricando l’app.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl border border-warning/25 bg-warning/[0.07] p-4">
          <Bot
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning"
          />
          <div>
            <p className="text-sm font-semibold">
              Vapi non viene aggiornato
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              La pubblicazione automatica del prompt è fuori dalla Task 7A.
            </p>
          </div>
        </div>
      </div>

      {validationIssues.length > 0 ? (
        <ValidationSummary
          issues={validationIssues}
          onSelectSection={setActiveSection}
          ref={validationSummaryRef}
        />
      ) : null}

      <form
        className={hasUnsavedChanges ? "pb-36 sm:pb-24" : undefined}
        onSubmit={(event) => {
          event.preventDefault();
          void saveSettings();
        }}
      >
        <div className="grid min-w-0 gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
          <Card className="min-w-0 shadow-none lg:sticky lg:top-24">
            <CardHeader className="border-b">
              <CardTitle>Configurazione</CardTitle>
              <CardDescription>
                Una sezione alla volta, senza perdere le modifiche.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-3">
              <SettingsSectionNav
                activeSection={activeSection}
                errorCounts={errorCounts}
                onSelect={setActiveSection}
              />
            </CardContent>
          </Card>

          <div className="min-w-0 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_oklch(0.18_0.03_278/0.04),0_12px_36px_oklch(0.18_0.03_278/0.05)] sm:p-6 lg:p-7">
            {activeSection === "profile" ? (
              <SalonProfileSettings
                issues={validationIssues}
                onChange={(salonProfile) =>
                  setDraft({ ...draft, salonProfile })
                }
                salon={salon}
                value={draft.salonProfile}
              />
            ) : null}

            {activeSection === "services" ? (
              <ServicesSettings
                issues={validationIssues}
                onChange={(services) => setDraft({ ...draft, services })}
                value={draft.services}
              />
            ) : null}

            {activeSection === "schedule" ? (
              <ScheduleSettings
                issues={validationIssues}
                onChange={({ openingHours, closures }) =>
                  setDraft({ ...draft, openingHours, closures })
                }
                value={{
                  openingHours: draft.openingHours,
                  closures: draft.closures,
                }}
              />
            ) : null}

            {activeSection === "faqs" ? (
              <FaqSettings
                issues={validationIssues}
                onChange={(faqs) => setDraft({ ...draft, faqs })}
                value={draft.faqs}
              />
            ) : null}

            {activeSection === "behavior" ? (
              <BehaviorSettings
                issues={validationIssues}
                onChange={({ policies, voiceAndTone }) =>
                  setDraft({ ...draft, policies, voiceAndTone })
                }
                value={{
                  policies: draft.policies,
                  voiceAndTone: draft.voiceAndTone,
                }}
              />
            ) : null}

            {activeSection === "escalation" ? (
              <EscalationSettings
                bookingProviderConfigured={bookingProviderConfigured}
                issues={validationIssues}
                onChange={({ bookingRules, escalation }) =>
                  setDraft({ ...draft, bookingRules, escalation })
                }
                value={{
                  bookingRules: draft.bookingRules,
                  escalation: draft.escalation,
                }}
              />
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "fixed inset-x-3 bottom-3 z-40 flex flex-col gap-3 rounded-2xl border bg-background/94 p-3 shadow-[0_16px_50px_oklch(0.16_0.04_278/0.16)] backdrop-blur-xl transition sm:flex-row sm:items-center sm:justify-between lg:left-[18.25rem]",
            !hasUnsavedChanges && "hidden",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning-foreground dark:text-warning">
              <CircleAlert aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Hai modifiche non salvate
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Se esci dalla pagina potrai scegliere se conservarle.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Button
              className="flex-1 sm:flex-none"
              disabled={isSaving}
              onClick={discardChanges}
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" data-icon="inline-start" />
              Annulla
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Save aria-hidden="true" data-icon="inline-start" />
              )}
              Salva modifiche
            </Button>
          </div>
        </div>
      </form>

      {feedback ? (
        <SettingsFeedback
          feedback={feedback}
          raised={hasUnsavedChanges}
        />
      ) : null}
    </div>
  );
}

interface ValidationSummaryProps {
  issues: ZodIssue[];
  onSelectSection: (section: SettingsSection) => void;
}

const ValidationSummary = forwardRef<
  HTMLDivElement,
  ValidationSummaryProps
>(function ValidationSummary({ issues, onSelectSection }, ref) {
  return (
    <div
      className="rounded-2xl border border-destructive/20 bg-destructive/[0.045] p-4 outline-none focus-visible:ring-3 focus-visible:ring-destructive/20 sm:p-5"
      ref={ref}
      role="alert"
      tabIndex={-1}
    >
      <div className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-destructive"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Correggi {issues.length}{" "}
            {issues.length === 1 ? "campo" : "campi"} prima di salvare
          </p>
          <ul className="mt-2 space-y-1.5">
            {issues.slice(0, 6).map((issue, index) => {
              const section = getIssueSection(issue);

              return (
                <li className="text-xs leading-5" key={`${issue.path}-${index}`}>
                  <button
                    className="text-left text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground"
                    onClick={() => onSelectSection(section)}
                    type="button"
                  >
                    <span className="font-semibold text-foreground">
                      {settingsSectionLabels[section]} ·{" "}
                      {formatIssuePath(issue.path)}
                    </span>
                    {": "}
                    {issue.message}
                  </button>
                </li>
              );
            })}
          </ul>
          {issues.length > 6 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Altri {issues.length - 6} campi sono indicati nelle sezioni.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
});

function SettingsFeedback({
  feedback,
  raised,
}: {
  feedback: Feedback;
  raised: boolean;
}) {
  const isSuccess = feedback.tone === "success";
  const isError = feedback.tone === "error";

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed right-4 bottom-4 z-50 flex max-w-sm gap-3 rounded-2xl border bg-background/96 p-4 shadow-2xl backdrop-blur-xl",
        raised && "bottom-40 sm:bottom-24",
        isSuccess && "border-success/25",
        isError && "border-destructive/25",
      )}
      role={isError ? "alert" : "status"}
    >
      {isSuccess ? (
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-success"
        />
      ) : (
        <CircleAlert
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-5 shrink-0",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
        />
      )}
      <div>
        <p className="text-sm font-semibold">{feedback.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {feedback.description}
        </p>
      </div>
    </div>
  );
}

function SettingsLoadingState() {
  return (
    <div
      aria-label="Caricamento impostazioni IA"
      className="space-y-7"
      role="status"
    >
      <span className="sr-only">Caricamento delle impostazioni…</span>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-3xl" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-[42rem] rounded-2xl" />
      </div>
    </div>
  );
}
