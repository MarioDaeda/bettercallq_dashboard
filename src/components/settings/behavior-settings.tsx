"use client";

import type { ZodIssue } from "zod";
import { Check, ClockAlert, MessageCircleHeart } from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsTextarea,
  SettingsToggle,
} from "@/components/settings/settings-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UpdateReceptionistSettingsInput } from "@/lib/domain";
import {
  getIssueMessage,
  optionalNumber,
  optionalText,
  toneLabels,
} from "@/lib/settings/settings";
import { cn } from "@/lib/utils";

interface BehaviorSettingsProps {
  issues: ZodIssue[];
  onChange: (
    value: Pick<
      UpdateReceptionistSettingsInput,
      "policies" | "voiceAndTone"
    >,
  ) => void;
  value: Pick<
    UpdateReceptionistSettingsInput,
    "policies" | "voiceAndTone"
  >;
}

export function BehaviorSettings({
  issues,
  onChange,
  value,
}: BehaviorSettingsProps) {
  return (
    <div className="space-y-7">
      <SettingsSectionHeading
        description="Stabilisci come la receptionist comunica regole e informazioni, mantenendo un tono coerente con il salone."
        eyebrow="Comportamento"
        title="Politiche e tono di voce"
      />

      <Card>
        <CardHeader className="flex-row items-start gap-3 border-b">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <ClockAlert aria-hidden="true" className="size-4" />
          </div>
          <div>
            <CardTitle>Politiche del salone</CardTitle>
            <CardDescription className="mt-1">
              Parametri che la receptionist può spiegare ai clienti in modo
              uniforme.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
          <SettingsField
            description="Quante ore prima chiedere una cancellazione."
            error={getIssueMessage(issues, [
              "policies",
              "cancellationNoticeHours",
            ])}
            htmlFor="cancellation-notice"
            label="Preavviso cancellazione · ore"
            optional
          >
            <SettingsInput
              aria-invalid={
                Boolean(
                  getIssueMessage(issues, [
                    "policies",
                    "cancellationNoticeHours",
                  ]),
                ) || undefined
              }
              id="cancellation-notice"
              min={0}
              onChange={(event) =>
                onChange({
                  ...value,
                  policies: {
                    ...value.policies,
                    cancellationNoticeHours: optionalNumber(
                      event.target.value,
                    ),
                  },
                })
              }
              placeholder="24"
              type="number"
              value={value.policies.cancellationNoticeHours ?? ""}
            />
          </SettingsField>

          <SettingsField
            description="Dopo quanti minuti il ritardo richiede una verifica."
            error={getIssueMessage(issues, [
              "policies",
              "lateArrivalMinutes",
            ])}
            htmlFor="late-arrival"
            label="Tolleranza ritardo · minuti"
            optional
          >
            <SettingsInput
              aria-invalid={
                Boolean(
                  getIssueMessage(issues, [
                    "policies",
                    "lateArrivalMinutes",
                  ]),
                ) || undefined
              }
              id="late-arrival"
              min={0}
              onChange={(event) =>
                onChange({
                  ...value,
                  policies: {
                    ...value.policies,
                    lateArrivalMinutes: optionalNumber(
                      event.target.value,
                    ),
                  },
                })
              }
              placeholder="10"
              type="number"
              value={value.policies.lateArrivalMinutes ?? ""}
            />
          </SettingsField>

          <SettingsField
            className="sm:col-span-2"
            error={getIssueMessage(issues, ["policies", "notes"])}
            htmlFor="policy-notes"
            label="Indicazioni aggiuntive"
            optional
          >
            <SettingsTextarea
              id="policy-notes"
              maxLength={1_000}
              onChange={(event) =>
                onChange({
                  ...value,
                  policies: {
                    ...value.policies,
                    notes: optionalText(event.target.value),
                  },
                })
              }
              placeholder="In caso di ritardo avvisare sempre il salone…"
              value={value.policies.notes ?? ""}
            />
          </SettingsField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start gap-3 border-b">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <MessageCircleHeart aria-hidden="true" className="size-4" />
          </div>
          <div>
            <CardTitle>Tono della receptionist</CardTitle>
            <CardDescription className="mt-1">
              Scegli una direzione chiara; le note affinano lo stile senza
              esporre il prompt di sistema.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <fieldset>
            <legend className="text-sm font-semibold">Stile principale</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(toneLabels).map(
                ([tone, { label, description }]) => {
                  const isSelected = value.voiceAndTone.tone === tone;

                  return (
                    <label
                      className={cn(
                        "relative cursor-pointer rounded-xl border p-4 transition-colors",
                        isSelected
                          ? "border-primary/40 bg-primary/[0.07]"
                          : "bg-muted/15 hover:bg-muted/40",
                      )}
                      key={tone}
                    >
                      <input
                        checked={isSelected}
                        className="sr-only"
                        name="voice-tone"
                        onChange={() =>
                          onChange({
                            ...value,
                            voiceAndTone: {
                              ...value.voiceAndTone,
                              tone: tone as keyof typeof toneLabels,
                            },
                          })
                        }
                        type="radio"
                        value={tone}
                      />
                      <span className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {isSelected ? (
                            <Check aria-hidden="true" className="size-3" />
                          ) : null}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {description}
                          </span>
                        </span>
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>

          <SettingsToggle
            checked={value.voiceAndTone.useCustomerName}
            description="Usa il nome quando è disponibile e il contesto lo rende naturale."
            label="Chiamare il cliente per nome"
            onCheckedChange={(useCustomerName) =>
              onChange({
                ...value,
                voiceAndTone: {
                  ...value.voiceAndTone,
                  useCustomerName,
                },
              })
            }
          />

          <SettingsField
            error={getIssueMessage(issues, ["voiceAndTone", "notes"])}
            htmlFor="tone-notes"
            label="Istruzioni di stile"
            optional
          >
            <SettingsTextarea
              id="tone-notes"
              maxLength={800}
              onChange={(event) =>
                onChange({
                  ...value,
                  voiceAndTone: {
                    ...value.voiceAndTone,
                    notes: optionalText(event.target.value),
                  },
                })
              }
              placeholder="Risposte semplici, niente tecnicismi, confermare sempre data e ora…"
              value={value.voiceAndTone.notes ?? ""}
            />
          </SettingsField>
        </CardContent>
      </Card>
    </div>
  );
}
