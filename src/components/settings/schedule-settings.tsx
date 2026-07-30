"use client";

import type { ZodIssue } from "zod";
import {
  CalendarOff,
  Clock3,
  Plus,
  Split,
  Trash2,
} from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsToggle,
} from "@/components/settings/settings-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  OpeningInterval,
  SpecialClosure,
  UpdateReceptionistSettingsInput,
} from "@/lib/domain";
import {
  createSpecialClosure,
  getIssueMessage,
  weekdayLabels,
  type Weekday,
} from "@/lib/settings/settings";

const weekdays = Object.keys(weekdayLabels) as Weekday[];

const addOneHour = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const nextHours = Math.min(hours + 1, 23);
  return `${String(nextHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

interface ScheduleSettingsProps {
  issues: ZodIssue[];
  onChange: (
    value: Pick<
      UpdateReceptionistSettingsInput,
      "openingHours" | "closures"
    >,
  ) => void;
  value: Pick<
    UpdateReceptionistSettingsInput,
    "openingHours" | "closures"
  >;
}

export function ScheduleSettings({
  issues,
  onChange,
  value,
}: ScheduleSettingsProps) {
  const updateDay = (day: Weekday, intervals: OpeningInterval[]) => {
    onChange({
      ...value,
      openingHours: {
        ...value.openingHours,
        [day]: intervals,
      },
    });
  };

  const updateClosure = (index: number, closure: SpecialClosure) => {
    const closures = [...value.closures];
    closures[index] = closure;
    onChange({ ...value, closures });
  };

  const openDays = weekdays.filter(
    (day) => value.openingHours[day].length > 0,
  ).length;

  return (
    <div className="space-y-7">
      <SettingsSectionHeading
        description="Configura le fasce in cui la receptionist considera aperto il salone. Più fasce nello stesso giorno rappresentano una pausa."
        eyebrow="Disponibilità"
        title="Orari, pause e chiusure"
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="success">{openDays} giorni aperti</Badge>
        <Badge variant="secondary">
          {value.closures.length} chiusure straordinarie
        </Badge>
      </div>

      <div className="space-y-3">
        {weekdays.map((day) => {
          const intervals = value.openingHours[day];
          const isOpen = intervals.length > 0;

          return (
            <Card className="shadow-none" key={day}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-center gap-3 sm:w-44 sm:shrink-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <Clock3 aria-hidden="true" className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {weekdayLabels[day]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isOpen ? `${intervals.length} fasce` : "Chiuso"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <SettingsToggle
                      checked={isOpen}
                      label={isOpen ? "Salone aperto" : "Giorno di chiusura"}
                      onCheckedChange={(checked) =>
                        updateDay(
                          day,
                          checked
                            ? [{ opensAt: "09:00", closesAt: "18:00" }]
                            : [],
                        )
                      }
                    />

                    {intervals.map((interval, intervalIndex) => {
                      const prefix: PropertyKey[] = [
                        "openingHours",
                        day,
                        intervalIndex,
                      ];
                      const opensError = getIssueMessage(issues, [
                        ...prefix,
                        "opensAt",
                      ]);
                      const closesError = getIssueMessage(issues, [
                        ...prefix,
                        "closesAt",
                      ]);

                      return (
                        <div
                          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                          key={`${day}-${intervalIndex}`}
                        >
                          <SettingsField
                            error={opensError}
                            htmlFor={`${day}-opens-${intervalIndex}`}
                            label={intervalIndex === 0 ? "Apre" : "Riapre"}
                          >
                            <SettingsInput
                              aria-invalid={
                                Boolean(opensError) || undefined
                              }
                              id={`${day}-opens-${intervalIndex}`}
                              onChange={(event) => {
                                const nextIntervals = [...intervals];
                                nextIntervals[intervalIndex] = {
                                  ...interval,
                                  opensAt: event.target.value,
                                };
                                updateDay(day, nextIntervals);
                              }}
                              type="time"
                              value={interval.opensAt}
                            />
                          </SettingsField>
                          <SettingsField
                            error={closesError}
                            htmlFor={`${day}-closes-${intervalIndex}`}
                            label={
                              intervalIndex < intervals.length - 1
                                ? "Pausa"
                                : "Chiude"
                            }
                          >
                            <SettingsInput
                              aria-invalid={
                                Boolean(closesError) || undefined
                              }
                              id={`${day}-closes-${intervalIndex}`}
                              onChange={(event) => {
                                const nextIntervals = [...intervals];
                                nextIntervals[intervalIndex] = {
                                  ...interval,
                                  closesAt: event.target.value,
                                };
                                updateDay(day, nextIntervals);
                              }}
                              type="time"
                              value={interval.closesAt}
                            />
                          </SettingsField>
                          <Button
                            aria-label={`Rimuovi fascia ${intervalIndex + 1} di ${weekdayLabels[day]}`}
                            className="mt-7"
                            onClick={() =>
                              updateDay(
                                day,
                                intervals.filter(
                                  (_, index) => index !== intervalIndex,
                                ),
                              )
                            }
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}

                    {isOpen &&
                    intervals.length < 4 &&
                    (intervals.at(-1)?.closesAt ?? "00:00") < "23:00" ? (
                      <Button
                        onClick={() => {
                          const previousClose =
                            intervals.at(-1)?.closesAt ?? "09:00";
                          const nextClose = addOneHour(previousClose);
                          updateDay(day, [
                            ...intervals,
                            {
                              opensAt:
                                previousClose >= "23:00"
                                  ? "22:00"
                                  : previousClose,
                              closesAt:
                                previousClose >= "23:00"
                                  ? "23:00"
                                  : nextClose,
                            },
                          ]);
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Split aria-hidden="true" data-icon="inline-start" />
                        Aggiungi fascia
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 border-b">
          <div>
            <CardTitle>Chiusure straordinarie</CardTitle>
            <CardDescription className="mt-1">
              Ferie, festività o giornate in cui gli orari settimanali non
              valgono.
            </CardDescription>
          </div>
          <Button
            aria-label="Aggiungi chiusura"
            onClick={() =>
              onChange({
                ...value,
                closures: [...value.closures, createSpecialClosure()],
              })
            }
            size="icon"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="pt-5">
          {value.closures.length === 0 ? (
            <EmptyState
              className="min-h-56"
              description="Aggiungi ferie o chiusure occasionali quando necessario."
              eyebrow="Calendario ordinario"
              title="Nessuna chiusura straordinaria"
            >
              <Button
                onClick={() =>
                  onChange({
                    ...value,
                    closures: [createSpecialClosure()],
                  })
                }
                type="button"
                variant="outline"
              >
                <CalendarOff
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                Aggiungi chiusura
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {value.closures.map((closure, index) => {
                const prefix: PropertyKey[] = ["closures", index];
                const startsError = getIssueMessage(issues, [
                  ...prefix,
                  "startsOn",
                ]);
                const endsError = getIssueMessage(issues, [
                  ...prefix,
                  "endsOn",
                ]);
                const reasonError = getIssueMessage(issues, [
                  ...prefix,
                  "reason",
                ]);

                return (
                  <div
                    className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto]"
                    key={closure.id}
                  >
                    <SettingsField
                      error={startsError}
                      htmlFor={`closure-start-${closure.id}`}
                      label="Dal"
                    >
                      <SettingsInput
                        aria-invalid={Boolean(startsError) || undefined}
                        id={`closure-start-${closure.id}`}
                        onChange={(event) =>
                          updateClosure(index, {
                            ...closure,
                            startsOn: event.target.value,
                          })
                        }
                        type="date"
                        value={closure.startsOn}
                      />
                    </SettingsField>
                    <SettingsField
                      error={endsError}
                      htmlFor={`closure-end-${closure.id}`}
                      label="Al"
                    >
                      <SettingsInput
                        aria-invalid={Boolean(endsError) || undefined}
                        id={`closure-end-${closure.id}`}
                        onChange={(event) =>
                          updateClosure(index, {
                            ...closure,
                            endsOn: event.target.value,
                          })
                        }
                        type="date"
                        value={closure.endsOn}
                      />
                    </SettingsField>
                    <SettingsField
                      error={reasonError}
                      htmlFor={`closure-reason-${closure.id}`}
                      label="Motivo"
                    >
                      <SettingsInput
                        aria-invalid={Boolean(reasonError) || undefined}
                        id={`closure-reason-${closure.id}`}
                        maxLength={160}
                        onChange={(event) =>
                          updateClosure(index, {
                            ...closure,
                            reason: event.target.value,
                          })
                        }
                        placeholder="Ferie estive"
                        value={closure.reason}
                      />
                    </SettingsField>
                    <Button
                      aria-label={`Rimuovi chiusura ${index + 1}`}
                      className="self-end sm:col-span-2 lg:col-span-1"
                      onClick={() =>
                        onChange({
                          ...value,
                          closures: value.closures.filter(
                            (_, closureIndex) => closureIndex !== index,
                          ),
                        })
                      }
                      size="icon-lg"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
