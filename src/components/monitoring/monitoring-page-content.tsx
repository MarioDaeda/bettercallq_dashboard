import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  PhoneCall,
  ShieldAlert,
  TriangleAlert,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { MonitoringPeriodFilter } from "@/components/monitoring/monitoring-period-filter";
import { MonitoringTrendChart } from "@/components/monitoring/monitoring-trend-chart";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IntegrationError, Salon } from "@/lib/domain";
import type { Overview } from "@/lib/services/dashboard-service";
import {
  aggregateMonitoringMetrics,
  calculateMetricDelta,
  monitoringPeriodLabels,
  type MetricDelta,
  type MonitoringPeriod,
  type MonitoringSummary,
} from "@/lib/monitoring/monitoring";
import {
  formatUsdMicros,
  formatDateTime,
  formatInteger,
  formatLocalDate,
} from "@/lib/overview/formatters";

interface MonitoringPageContentProps {
  current: Overview;
  period: MonitoringPeriod;
  periodDays: number;
  previous: Overview;
  reportingDate: string;
  salon: Salon;
}

type DeltaIntent = "positive-up" | "positive-down" | "neutral";

const percentFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 1,
  style: "percent",
});

const providerLabels: Record<IntegrationError["provider"], string> = {
  vapi: "Vapi",
  whatsapp: "WhatsApp",
  treatwell: "Treatwell",
  google_calendar: "Google Calendar",
  internal: "BetterCallQ",
};

const severityVariants: Record<
  IntegrationError["severity"],
  "outline" | "warning" | "destructive"
> = {
  info: "outline",
  warning: "warning",
  error: "destructive",
  critical: "destructive",
};

function formatAvailableCost(
  summary: MonitoringSummary,
): string {
  return summary.callsWithCostData === 0
    ? "Non disponibile"
    : formatUsdMicros(summary.costTotalUsdMicros);
}

function costKpiDescription(
  summary: MonitoringSummary,
): string {
  if (summary.callsWithCostData === 0) {
    return "Nessun report Vapi con costo disponibile nel periodo.";
  }

  return `${formatUsdMicros(summary.costPerCostedCallUsdMicros)} per chiamata con costo; proiezione mensile ${formatUsdMicros(summary.projectedMonthlyCostUsdMicros)}. Copertura ${summary.callsWithCostData}/${summary.callsReceived}.`;
}

export function MonitoringPageContent({
  current,
  period,
  periodDays,
  previous,
  reportingDate,
  salon,
}: MonitoringPageContentProps) {
  const currentSummary = aggregateMonitoringMetrics(
    current.metrics,
    periodDays,
  );
  const previousSummary = aggregateMonitoringMetrics(
    previous.metrics,
    periodDays,
  );
  const currentLabel = monitoringPeriodLabels[period];
  const previousLabel =
    period === "today" ? "Giorno precedente" : "7 giorni precedenti";

  const comparisonRows: ComparisonRowProps[] = [
    {
      label: "Contatti gestiti",
      current: formatInteger(currentSummary.contactsHandled),
      previous: formatInteger(previousSummary.contactsHandled),
      delta: calculateMetricDelta(
        currentSummary.contactsHandled,
        previousSummary.contactsHandled,
      ),
      intent: "neutral",
    },
    {
      label: "Completamento chiamate",
      current: percentFormatter.format(currentSummary.completionRate),
      previous: percentFormatter.format(previousSummary.completionRate),
      delta: calculateMetricDelta(
        currentSummary.completionRate,
        previousSummary.completionRate,
      ),
      intent: "positive-up",
    },
    {
      label: "Interventi creati",
      current: formatInteger(currentSummary.interventionsCreated),
      previous: formatInteger(previousSummary.interventionsCreated),
      delta: calculateMetricDelta(
        currentSummary.interventionsCreated,
        previousSummary.interventionsCreated,
      ),
      intent: "positive-down",
    },
    {
      label: "Errori integrazione",
      current: formatInteger(currentSummary.integrationErrors),
      previous: formatInteger(previousSummary.integrationErrors),
      delta: calculateMetricDelta(
        currentSummary.integrationErrors,
        previousSummary.integrationErrors,
      ),
      intent: "positive-down",
    },
    {
      label: "Costo reale Vapi",
      current: formatAvailableCost(currentSummary),
      previous: formatAvailableCost(previousSummary),
      delta: calculateMetricDelta(
        currentSummary.costTotalUsdMicros,
        previousSummary.costTotalUsdMicros,
      ),
      intent: "positive-down",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="Monitoraggio · dati Supabase"
          description="Volumi, qualità e costi reali comunicati da Vapi e letti da Supabase, con copertura esplicita del dato."
          title="Numeri utili, senza una console tecnica."
        />
        <div className="shrink-0">
          <MonitoringPeriodFilter activePeriod={period} />
          <p className="mt-2 text-right text-[0.7rem] text-muted-foreground">
            Dati disponibili fino al {formatLocalDate(reportingDate)}
          </p>
        </div>
      </div>

      <section
        aria-label="Indicatori principali del monitoraggio"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          description={`${formatInteger(currentSummary.callsReceived)} chiamate + ${formatInteger(currentSummary.whatsappConversations)} conversazioni.`}
          delta={calculateMetricDelta(
            currentSummary.contactsHandled,
            previousSummary.contactsHandled,
          )}
          icon={PhoneCall}
          intent="neutral"
          label="Contatti gestiti"
          previousLabel={previousLabel}
          value={formatInteger(currentSummary.contactsHandled)}
        />
        <KpiCard
          description={`${formatInteger(currentSummary.callsCompleted)} chiamate completate su ${formatInteger(currentSummary.callsReceived)} ricevute.`}
          delta={calculateMetricDelta(
            currentSummary.completionRate,
            previousSummary.completionRate,
          )}
          icon={CheckCircle2}
          intent="positive-up"
          label="Tasso di completamento"
          previousLabel={previousLabel}
          value={percentFormatter.format(currentSummary.completionRate)}
        />
        <KpiCard
          description={`${formatDuration(currentSummary.callDurationSeconds)} complessivi nel periodo.`}
          delta={calculateMetricDelta(
            currentSummary.averageCallDurationSeconds,
            previousSummary.averageCallDurationSeconds,
          )}
          icon={Clock3}
          intent="neutral"
          label="Durata media chiamata"
          previousLabel={previousLabel}
          value={formatDuration(currentSummary.averageCallDurationSeconds)}
        />
        <KpiCard
          description={costKpiDescription(currentSummary)}
          delta={calculateMetricDelta(
            currentSummary.costTotalUsdMicros,
            previousSummary.costTotalUsdMicros,
          )}
          icon={WalletCards}
          intent="positive-down"
          label="Costo reale Vapi"
          previousLabel={previousLabel}
          value={formatAvailableCost(currentSummary)}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Andamento giornaliero</CardTitle>
              <CardDescription className="mt-1">
                Chiamate e WhatsApp sull’asse sinistro; costo reale Vapi
                in USD sull’asse destro.
              </CardDescription>
            </div>
            <Badge variant="outline">{currentLabel}</Badge>
          </CardHeader>
          <CardContent>
            {current.metrics.length === 0 ? (
              <EmptyPanel text="Nessuna metrica disponibile nel periodo selezionato." />
            ) : (
              <MonitoringTrendChart metrics={current.metrics} />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Qualità operativa</CardTitle>
            <CardDescription className="mt-1">
              Richieste concluse, eccezioni e risultato commerciale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <OperationalRow
              icon={CalendarCheck2}
              label="Prenotazioni attribuite"
              value={formatInteger(currentSummary.bookingsAttributed)}
            />
            <OperationalRow
              icon={Bot}
              label="Completamento IA"
              value={percentFormatter.format(currentSummary.completionRate)}
            />
            <OperationalRow
              icon={CircleAlert}
              label="Interventi creati"
              value={`${formatInteger(currentSummary.interventionsCreated)} · ${percentFormatter.format(currentSummary.interventionRate)} dei contatti`}
            />
            <OperationalRow
              icon={CheckCircle2}
              label="Interventi risolti"
              value={formatInteger(currentSummary.interventionsResolved)}
            />
            <OperationalRow
              icon={ShieldAlert}
              label="Errori integrazione"
              value={formatInteger(currentSummary.integrationErrors)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <CostBreakdownCard summary={currentSummary} />

        <Card className="xl:col-span-7">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Confronto tra periodi</CardTitle>
              <CardDescription className="mt-1">
                Stessa durata e stesse unità per evitare confronti fuorvianti.
              </CardDescription>
            </div>
            <Badge variant="secondary">{previousLabel}</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Metrica</th>
                    <th className="pb-3 text-right font-medium">{currentLabel}</th>
                    <th className="pb-3 text-right font-medium">Prima</th>
                    <th className="pb-3 text-right font-medium">Variazione</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparisonRows.map((row) => (
                    <ComparisonRow key={row.label} {...row} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Eventi da controllare</CardTitle>
              <CardDescription className="mt-1">
                Messaggi leggibili dal salone; i codici tecnici restano secondari.
              </CardDescription>
            </div>
            <Badge
              variant={
                current.recentErrors.some((item) => item.status !== "resolved")
                  ? "warning"
                  : "success"
              }
            >
              {current.recentErrors.length} eventi
            </Badge>
          </CardHeader>
          <CardContent>
            {current.recentErrors.length === 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border bg-success/5 p-4">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-success"
                />
                <div>
                  <p className="text-sm font-semibold">Nessun evento recente</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Nel periodo selezionato non risultano errori operativi.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {current.recentErrors.map((error) => (
                  <li className="flex gap-3 py-4 first:pt-0 last:pb-0" key={error.id}>
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-warning/15 text-warning-foreground dark:text-warning">
                      <TriangleAlert aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {providerLabels[error.provider]}
                        </p>
                        <Badge variant={severityVariants[error.severity]}>
                          {error.status === "resolved" ? "Risolto" : "Da controllare"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {error.publicMessage}
                      </p>
                      <p className="mt-2 text-[0.7rem] text-muted-foreground">
                        {formatDateTime(error.createdAt, salon.timezone)} · tentativi {error.attemptCount}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Copertura e origine dei costi</CardTitle>
            <CardDescription className="mt-1">
              Importi USD comunicati da Vapi, senza tariffe demo o conversione in euro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-5 text-muted-foreground">
            <FormulaRow
              icon={PhoneCall}
              text={`Chiamate con costo disponibile: ${currentSummary.callsWithCostData} su ${currentSummary.callsReceived}.`}
            />
            <FormulaRow
              icon={CircleAlert}
              text={`Chiamate senza costo: ${currentSummary.callsWithoutCostData}; sono escluse da totale, media e ripartizione.`}
            />
            <FormulaRow
              icon={Coins}
              text="Il totale e le componenti provengono dal report finale Vapi persistito in Supabase."
            />
            <FormulaRow
              icon={WalletCards}
              text={`Proiezione mensile = costo disponibile del periodo / ${periodDays} × 30.`}
            />
            <div className="rounded-2xl border bg-muted/25 p-3">
              Periodo: <strong className="text-foreground">{currentLabel}</strong> ·
              copertura {percentFormatter.format(currentSummary.costCoverageRate)}.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface KpiCardProps {
  description: string;
  delta: MetricDelta;
  icon: LucideIcon;
  intent: DeltaIntent;
  label: string;
  previousLabel: string;
  value: string;
}

function KpiCard({
  description,
  delta,
  icon: Icon,
  intent,
  label,
  previousLabel,
  value,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <DeltaBadge delta={delta} intent={intent} />
        </div>
        <p className="mt-5 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
        <p className="mt-3 text-[0.68rem] text-muted-foreground">
          Confronto: {previousLabel.toLocaleLowerCase("it-IT")}
        </p>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({
  delta,
  intent,
}: {
  delta: MetricDelta;
  intent: DeltaIntent;
}) {
  const Icon =
    delta.direction === "up"
      ? ArrowUpRight
      : delta.direction === "down"
        ? ArrowDownRight
        : ArrowRight;
  const isPositive =
    delta.direction === "flat" ||
    intent === "neutral" ||
    (intent === "positive-up" && delta.direction === "up") ||
    (intent === "positive-down" && delta.direction === "down");
  const variant =
    delta.direction === "flat" || intent === "neutral"
      ? "outline"
      : isPositive
        ? "success"
        : "warning";

  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" className="size-3.5" />
      {delta.percent === null
        ? "nuovo"
        : delta.direction === "flat"
          ? "stabile"
          : percentFormatter.format(Math.abs(delta.percent))}
    </Badge>
  );
}

function OperationalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function CostBreakdownCard({ summary }: { summary: MonitoringSummary }) {
  const entries = [
    {
      label: "Trascrizione (STT)",
      value: summary.costBreakdown.sttUsdMicros,
    },
    {
      label: "Modello linguistico (LLM)",
      value: summary.costBreakdown.llmUsdMicros,
    },
    {
      label: "Sintesi vocale (TTS)",
      value: summary.costBreakdown.ttsUsdMicros,
    },
    {
      label: "Piattaforma Vapi",
      value: summary.costBreakdown.vapiUsdMicros,
    },
    {
      label: "Trasporto",
      value: summary.costBreakdown.transportUsdMicros,
    },
    {
      label: "Chat Vapi",
      value: summary.costBreakdown.chatUsdMicros,
    },
    {
      label: "Knowledge base",
      value: summary.costBreakdown.knowledgeBaseUsdMicros,
    },
    {
      label: "Altro non classificato",
      value: summary.costBreakdown.unclassifiedUsdMicros,
    },
  ].filter((entry) => entry.value > 0);
  const total = Math.max(
    1,
    summary.costBreakdown.totalUsdMicros,
  );

  return (
    <Card className="xl:col-span-5">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Ripartizione del costo Vapi</CardTitle>
          <CardDescription className="mt-1">
            Componenti reali dei report disponibili; le chiamate storiche senza
            costo sono escluse.
          </CardDescription>
        </div>
        <Badge variant="outline">
          {formatAvailableCost(summary)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.callsWithCostData === 0 ? (
          <EmptyPanel text="Nessun costo Vapi disponibile nel periodo selezionato." />
        ) : (
          entries.map((entry) => {
            const percentage = entry.value / total;
            return (
              <div className="space-y-2" key={entry.label}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">{entry.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatUsdMicros(entry.value)} · {percentFormatter.format(percentage)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, percentage * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

interface ComparisonRowProps {
  current: string;
  delta: MetricDelta;
  intent: DeltaIntent;
  label: string;
  previous: string;
}

function ComparisonRow({
  current,
  delta,
  intent,
  label,
  previous,
}: ComparisonRowProps) {
  return (
    <tr>
      <td className="py-3 font-medium">{label}</td>
      <td className="py-3 text-right font-semibold tabular-nums">{current}</td>
      <td className="py-3 text-right tabular-nums text-muted-foreground">
        {previous}
      </td>
      <td className="py-3 text-right">
        <DeltaBadge delta={delta} intent={intent} />
      </td>
    </tr>
  );
}

function FormulaRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <p>{text}</p>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${formatInteger(seconds)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0
    ? `${formatInteger(minutes)} min`
    : `${formatInteger(minutes)} min ${formatInteger(remainingSeconds)} sec`;
}
