"use client";

import type { ZodIssue } from "zod";
import { CircleAlert, Plus, Scissors, Trash2 } from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsTextarea,
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
  ServiceConfig,
  UpdateReceptionistSettingsInput,
} from "@/lib/domain";
import {
  createServiceConfig,
  getIssueMessage,
  optionalNumber,
  optionalText,
} from "@/lib/settings/settings";

interface ServicesSettingsProps {
  issues: ZodIssue[];
  onChange: (services: UpdateReceptionistSettingsInput["services"]) => void;
  value: UpdateReceptionistSettingsInput["services"];
}

export function ServicesSettings({
  issues,
  onChange,
  value,
}: ServicesSettingsProps) {
  const updateService = (index: number, service: ServiceConfig) => {
    const services = [...value];
    services[index] = service;
    onChange(services);
  };

  const removeService = (index: number) => {
    onChange(value.filter((_, serviceIndex) => serviceIndex !== index));
  };

  const enabledCount = value.filter((service) => service.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SettingsSectionHeading
          description="Indica cosa può riconoscere la receptionist. Prezzi e durate restano manuali finché la proprietà dei dati Treatwell non sarà confermata."
          eyebrow="Catalogo"
          title="Servizi"
        />
        <Button
          className="sm:shrink-0"
          onClick={() => onChange([...value, createServiceConfig()])}
          size="lg"
          type="button"
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Nuovo servizio
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{value.length} configurati</Badge>
        <Badge variant={enabledCount > 0 ? "success" : "warning"}>
          {enabledCount} attivi
        </Badge>
      </div>

      <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] px-4 py-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Operatori, disponibilità e identificativi Treatwell verranno
          collegati soltanto dopo il Gate T. Questa schermata non crea un
          secondo catalogo sull’agenda reale.
        </p>
      </div>

      {value.length === 0 ? (
        <EmptyState
          description="Aggiungi il primo servizio per insegnare alla receptionist quali richieste può riconoscere."
          eyebrow="Catalogo vuoto"
          title="Nessun servizio configurato"
        >
          <Button
            onClick={() => onChange([createServiceConfig()])}
            size="lg"
            type="button"
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            Aggiungi servizio
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {value.map((service, index) => {
            const prefix: PropertyKey[] = ["services", index];
            const nameError = getIssueMessage(issues, [...prefix, "name"]);
            const durationError = getIssueMessage(issues, [
              ...prefix,
              "durationMinutes",
            ]);
            const priceError = getIssueMessage(issues, [
              ...prefix,
              "priceCents",
            ]);

            return (
              <Card key={service.id}>
                <CardHeader className="gap-4 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                        <Scissors aria-hidden="true" className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {service.name || `Nuovo servizio ${index + 1}`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {service.enabled
                            ? "La receptionist può proporlo."
                            : "Servizio temporaneamente nascosto."}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      aria-label={`Rimuovi ${service.name || `servizio ${index + 1}`}`}
                      onClick={() => removeService(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <SettingsToggle
                    checked={service.enabled}
                    description="Puoi disattivarlo senza perdere prezzi e regole."
                    label="Servizio disponibile alla receptionist"
                    onCheckedChange={(enabled) =>
                      updateService(index, { ...service, enabled })
                    }
                  />
                </CardHeader>
                <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
                  <SettingsField
                    error={nameError}
                    htmlFor={`service-name-${service.id}`}
                    label="Nome servizio"
                  >
                    <SettingsInput
                      aria-invalid={Boolean(nameError) || undefined}
                      id={`service-name-${service.id}`}
                      maxLength={80}
                      onChange={(event) =>
                        updateService(index, {
                          ...service,
                          name: event.target.value,
                        })
                      }
                      placeholder="Taglio donna"
                      value={service.name}
                    />
                  </SettingsField>

                  <SettingsField
                    description="Separali con una virgola."
                    error={getIssueMessage(issues, [...prefix, "aliases"])}
                    htmlFor={`service-aliases-${service.id}`}
                    label="Nomi alternativi"
                    optional
                  >
                    <SettingsInput
                      id={`service-aliases-${service.id}`}
                      onChange={(event) =>
                        updateService(index, {
                          ...service,
                          aliases: event.target.value
                            .split(",")
                            .map((alias) => alias.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="spuntatina, accorciare"
                      value={service.aliases.join(", ")}
                    />
                  </SettingsField>

                  <SettingsField
                    error={durationError}
                    htmlFor={`service-duration-${service.id}`}
                    label="Durata in minuti"
                    optional
                  >
                    <SettingsInput
                      aria-invalid={Boolean(durationError) || undefined}
                      id={`service-duration-${service.id}`}
                      inputMode="numeric"
                      max={720}
                      min={5}
                      onChange={(event) =>
                        updateService(index, {
                          ...service,
                          durationMinutes: optionalNumber(
                            event.target.value,
                          ),
                        })
                      }
                      placeholder="45"
                      type="number"
                      value={service.durationMinutes ?? ""}
                    />
                  </SettingsField>

                  <SettingsField
                    error={priceError}
                    htmlFor={`service-price-${service.id}`}
                    label="Prezzo indicativo in euro"
                    optional
                  >
                    <SettingsInput
                      aria-invalid={Boolean(priceError) || undefined}
                      id={`service-price-${service.id}`}
                      inputMode="decimal"
                      min={0}
                      onChange={(event) => {
                        const euros = optionalNumber(event.target.value);
                        updateService(index, {
                          ...service,
                          priceCents:
                            euros === undefined
                              ? undefined
                              : Math.round(euros * 100),
                        });
                      }}
                      placeholder="25,00"
                      step="0.5"
                      type="number"
                      value={
                        service.priceCents === undefined
                          ? ""
                          : service.priceCents / 100
                      }
                    />
                  </SettingsField>

                  <SettingsField
                    className="sm:col-span-2"
                    error={getIssueMessage(issues, [
                      ...prefix,
                      "description",
                    ])}
                    htmlFor={`service-description-${service.id}`}
                    label="Descrizione per la receptionist"
                    optional
                  >
                    <SettingsTextarea
                      className="min-h-24"
                      id={`service-description-${service.id}`}
                      maxLength={500}
                      onChange={(event) =>
                        updateService(index, {
                          ...service,
                          description: optionalText(event.target.value),
                        })
                      }
                      placeholder="Cosa comprende e quali richieste deve riconoscere…"
                      value={service.description ?? ""}
                    />
                  </SettingsField>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
