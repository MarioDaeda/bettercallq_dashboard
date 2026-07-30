"use client";

import type { ZodIssue } from "zod";
import {
  ArrowRightLeft,
  CalendarCheck2,
  Check,
  PhoneForwarded,
} from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsToggle,
} from "@/components/settings/settings-controls";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  InterventionReason,
  UpdateReceptionistSettingsInput,
} from "@/lib/domain";
import { interventionReasonLabels } from "@/lib/interventions/labels";
import {
  getIssueMessage,
  optionalNumber,
  optionalText,
} from "@/lib/settings/settings";
import { cn } from "@/lib/utils";

const interventionReasons = Object.keys(
  interventionReasonLabels,
) as InterventionReason[];

const interventionReasonDescriptions: Record<InterventionReason, string> = {
  human_requested: "Il cliente chiede esplicitamente una persona.",
  service_not_recognized: "Il servizio richiesto non è nel catalogo.",
  availability_unavailable: "Non è possibile verificare uno slot.",
  booking_incomplete: "Mancano dati essenziali per concludere.",
  special_request: "La richiesta richiede una valutazione del salone.",
  booking_sync_failed: "L’appuntamento non viene sincronizzato.",
  customer_dispute: "Il cliente contesta prezzo, servizio o appuntamento.",
  integration_error: "Un canale o provider restituisce un errore.",
  other: "Qualsiasi altro caso non gestibile in sicurezza.",
};

interface EscalationSettingsProps {
  bookingProviderConfigured: boolean;
  issues: ZodIssue[];
  onChange: (
    value: Pick<
      UpdateReceptionistSettingsInput,
      "bookingRules" | "escalation"
    >,
  ) => void;
  value: Pick<
    UpdateReceptionistSettingsInput,
    "bookingRules" | "escalation"
  >;
}

export function EscalationSettings({
  bookingProviderConfigured,
  issues,
  onChange,
  value,
}: EscalationSettingsProps) {
  const toggleReason = (
    reason: InterventionReason,
    checked: boolean,
  ) => {
    const reasons = checked
      ? [...new Set([...value.escalation.reasons, reason])]
      : value.escalation.reasons.filter((item) => item !== reason);

    onChange({
      ...value,
      escalation: { ...value.escalation, reasons },
    });
  };

  return (
    <div className="space-y-7">
      <SettingsSectionHeading
        description="Imposta i limiti entro cui la receptionist può agire e i casi in cui deve fermarsi o coinvolgere il salone."
        eyebrow="Controllo"
        title="Prenotazioni ed escalation"
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 border-b">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <CalendarCheck2 aria-hidden="true" className="size-4" />
            </div>
            <div>
              <CardTitle>Regole di prenotazione</CardTitle>
              <CardDescription className="mt-1">
                Limiti operativi salvati in BetterCallQ.
              </CardDescription>
            </div>
          </div>
          <Badge
            className="shrink-0"
            variant={bookingProviderConfigured ? "success" : "warning"}
          >
            {bookingProviderConfigured
              ? "Provider configurato"
              : "Gate Treatwell aperto"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {!bookingProviderConfigured ? (
            <div className="rounded-xl border border-warning/25 bg-warning/[0.07] px-4 py-3 text-xs leading-5 text-muted-foreground">
              Queste regole preparano il comportamento desiderato, ma non
              autorizzano ancora operazioni reali su Treatwell.
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-3">
            <SettingsField
              description="Quanto prima può essere fissato uno slot."
              error={getIssueMessage(issues, [
                "bookingRules",
                "minimumNoticeMinutes",
              ])}
              htmlFor="minimum-notice"
              label="Anticipo minimo · minuti"
              optional
            >
              <SettingsInput
                aria-invalid={
                  Boolean(
                    getIssueMessage(issues, [
                      "bookingRules",
                      "minimumNoticeMinutes",
                    ]),
                  ) || undefined
                }
                id="minimum-notice"
                min={0}
                onChange={(event) =>
                  onChange({
                    ...value,
                    bookingRules: {
                      ...value.bookingRules,
                      minimumNoticeMinutes: optionalNumber(
                        event.target.value,
                      ),
                    },
                  })
                }
                placeholder="120"
                type="number"
                value={value.bookingRules.minimumNoticeMinutes ?? ""}
              />
            </SettingsField>

            <SettingsField
              description="Quanto lontano nel futuro accettare richieste."
              error={getIssueMessage(issues, [
                "bookingRules",
                "maximumAdvanceDays",
              ])}
              htmlFor="maximum-advance"
              label="Prenotazione futura · giorni"
              optional
            >
              <SettingsInput
                aria-invalid={
                  Boolean(
                    getIssueMessage(issues, [
                      "bookingRules",
                      "maximumAdvanceDays",
                    ]),
                  ) || undefined
                }
                id="maximum-advance"
                min={1}
                onChange={(event) =>
                  onChange({
                    ...value,
                    bookingRules: {
                      ...value.bookingRules,
                      maximumAdvanceDays: optionalNumber(
                        event.target.value,
                      ),
                    },
                  })
                }
                placeholder="60"
                type="number"
                value={value.bookingRules.maximumAdvanceDays ?? ""}
              />
            </SettingsField>

            <SettingsField
              description="Margine interno tra due appuntamenti."
              error={getIssueMessage(issues, [
                "bookingRules",
                "preparationMinutes",
              ])}
              htmlFor="preparation-minutes"
              label="Preparazione · minuti"
              optional
            >
              <SettingsInput
                aria-invalid={
                  Boolean(
                    getIssueMessage(issues, [
                      "bookingRules",
                      "preparationMinutes",
                    ]),
                  ) || undefined
                }
                id="preparation-minutes"
                min={0}
                onChange={(event) =>
                  onChange({
                    ...value,
                    bookingRules: {
                      ...value.bookingRules,
                      preparationMinutes: optionalNumber(
                        event.target.value,
                      ),
                    },
                  })
                }
                placeholder="5"
                type="number"
                value={value.bookingRules.preparationMinutes ?? ""}
              />
            </SettingsField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsToggle
              checked={value.bookingRules.allowAiReschedule}
              description="La capacità reale dipenderà dal provider verificato."
              label="Consentire modifiche all’IA"
              onCheckedChange={(allowAiReschedule) =>
                onChange({
                  ...value,
                  bookingRules: {
                    ...value.bookingRules,
                    allowAiReschedule,
                  },
                })
              }
            />
            <SettingsToggle
              checked={value.bookingRules.allowAiCancellation}
              description="La capacità reale dipenderà dal provider verificato."
              label="Consentire cancellazioni all’IA"
              onCheckedChange={(allowAiCancellation) =>
                onChange({
                  ...value,
                  bookingRules: {
                    ...value.bookingRules,
                    allowAiCancellation,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start gap-3 border-b">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <PhoneForwarded aria-hidden="true" className="size-4" />
          </div>
          <div>
            <CardTitle>Trasferimento al salone</CardTitle>
            <CardDescription className="mt-1">
              Numero e condizioni per interrompere il flusso automatico.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <SettingsField
            description="Formato internazionale, ad esempio +390000000000."
            error={getIssueMessage(issues, [
              "escalation",
              "transferPhone",
            ])}
            htmlFor="transfer-phone"
            label="Numero di trasferimento"
            optional
          >
            <SettingsInput
              aria-invalid={
                Boolean(
                  getIssueMessage(issues, [
                    "escalation",
                    "transferPhone",
                  ]),
                ) || undefined
              }
              autoComplete="tel"
              id="transfer-phone"
              inputMode="tel"
              onChange={(event) =>
                onChange({
                  ...value,
                  escalation: {
                    ...value.escalation,
                    transferPhone: optionalText(event.target.value),
                  },
                })
              }
              placeholder="+390000000000"
              value={value.escalation.transferPhone ?? ""}
            />
          </SettingsField>

          <SettingsToggle
            checked={
              value.escalation.transferDuringOpeningHoursOnly
            }
            description="Fuori orario la receptionist raccoglie i dati e crea una richiesta da gestire."
            label="Trasferire soltanto durante l’apertura"
            onCheckedChange={(transferDuringOpeningHoursOnly) =>
              onChange({
                ...value,
                escalation: {
                  ...value.escalation,
                  transferDuringOpeningHoursOnly,
                },
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start gap-3 border-b">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <ArrowRightLeft aria-hidden="true" className="size-4" />
          </div>
          <div>
            <CardTitle>Quando coinvolgere una persona</CardTitle>
            <CardDescription className="mt-1">
              Seleziona i casi che devono creare una richiesta in “Da
              gestire”.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <fieldset>
            <legend className="sr-only">Condizioni di intervento umano</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {interventionReasons.map((reason) => {
                const checked =
                  value.escalation.reasons.includes(reason);

                return (
                  <label
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-colors",
                      checked
                        ? "border-primary/35 bg-primary/[0.065]"
                        : "bg-muted/15 hover:bg-muted/40",
                    )}
                    key={reason}
                  >
                    <input
                      checked={checked}
                      className="sr-only"
                      onChange={(event) =>
                        toggleReason(reason, event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {checked ? (
                          <Check aria-hidden="true" className="size-3" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {interventionReasonLabels[reason]}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {interventionReasonDescriptions[reason]}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {getIssueMessage(issues, ["escalation", "reasons"]) ? (
            <p className="mt-3 text-xs font-medium text-destructive">
              {getIssueMessage(issues, ["escalation", "reasons"])}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
