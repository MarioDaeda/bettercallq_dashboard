"use client";

import type { ZodIssue } from "zod";
import { CreditCard, MapPin, Phone, Plus, Trash2 } from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsTextarea,
} from "@/components/settings/settings-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Salon, UpdateReceptionistSettingsInput } from "@/lib/domain";
import { getIssueMessage, optionalText } from "@/lib/settings/settings";

interface SalonProfileSettingsProps {
  issues: ZodIssue[];
  onChange: (
    value: UpdateReceptionistSettingsInput["salonProfile"],
  ) => void;
  salon: Salon;
  value: UpdateReceptionistSettingsInput["salonProfile"];
}

export function SalonProfileSettings({
  issues,
  onChange,
  salon,
  value,
}: SalonProfileSettingsProps) {
  const updatePaymentMethod = (index: number, paymentMethod: string) => {
    const paymentMethods = [...value.paymentMethods];
    paymentMethods[index] = paymentMethod;
    onChange({ ...value, paymentMethods });
  };

  const removePaymentMethod = (index: number) => {
    onChange({
      ...value,
      paymentMethods: value.paymentMethods.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSectionHeading
        description="Definisci le informazioni che la receptionist usa per presentare il salone e rispondere alle domande pratiche."
        eyebrow="Identità"
        title="Profilo del salone"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ReadOnlyProfileItem
          icon={MapPin}
          label="Sede autorevole"
          value={
            salon.address
              ? `${salon.address.street}, ${salon.address.city}`
              : "Indirizzo non configurato"
          }
        />
        <ReadOnlyProfileItem
          icon={Phone}
          label="Telefono"
          value={salon.phoneNumber ?? "Non configurato"}
        />
        <ReadOnlyProfileItem
          icon={CreditCard}
          label="Profilo"
          value={salon.name}
        />
      </div>

      <div className="rounded-xl border border-info/20 bg-info/[0.055] px-4 py-3 text-xs leading-5 text-muted-foreground">
        Nome, indirizzo e telefono provengono dal profilo del salone e non
        vengono duplicati qui. In questa sezione modifichi come la receptionist
        descrive il salone.
      </div>

      <SettingsField
        description="Usa informazioni concrete: specializzazione, atmosfera e ciò che distingue il salone."
        error={getIssueMessage(issues, ["salonProfile", "description"])}
        htmlFor="salon-description"
        label="Descrizione del salone"
      >
        <SettingsTextarea
          aria-invalid={
            Boolean(
              getIssueMessage(issues, ["salonProfile", "description"]),
            ) || undefined
          }
          id="salon-description"
          maxLength={1_000}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
          placeholder="Un salone accogliente specializzato in…"
          value={value.description}
        />
      </SettingsField>

      <SettingsField
        description="Indica dove parcheggiare o come raggiungere facilmente l’ingresso."
        error={getIssueMessage(issues, ["salonProfile", "parkingInfo"])}
        htmlFor="parking-info"
        label="Parcheggio e accesso"
        optional
      >
        <SettingsTextarea
          aria-invalid={
            Boolean(
              getIssueMessage(issues, ["salonProfile", "parkingInfo"]),
            ) || undefined
          }
          className="min-h-24"
          id="parking-info"
          maxLength={500}
          onChange={(event) =>
            onChange({
              ...value,
              parkingInfo: optionalText(event.target.value),
            })
          }
          placeholder="Parcheggio pubblico a 100 metri…"
          value={value.parkingInfo ?? ""}
        />
      </SettingsField>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Metodi di pagamento</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            La receptionist li può comunicare senza promettere metodi non
            disponibili.
          </p>
        </div>

        {value.paymentMethods.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/25 px-4 py-5 text-center text-sm text-muted-foreground">
            Aggiungi almeno un metodo di pagamento.
          </div>
        ) : (
          <div className="space-y-2">
            {value.paymentMethods.map((paymentMethod, index) => {
              const inputId = `payment-method-${index}`;
              const error = getIssueMessage(issues, [
                "salonProfile",
                "paymentMethods",
                index,
              ]);

              return (
                <div className="flex items-start gap-2" key={index}>
                  <label className="sr-only" htmlFor={inputId}>
                    Metodo di pagamento {index + 1}
                  </label>
                  <SettingsInput
                    aria-invalid={Boolean(error) || undefined}
                    id={inputId}
                    maxLength={80}
                    onChange={(event) =>
                      updatePaymentMethod(index, event.target.value)
                    }
                    placeholder="Carta, contanti…"
                    value={paymentMethod}
                  />
                  <Button
                    aria-label={`Rimuovi metodo di pagamento ${index + 1}`}
                    onClick={() => removePaymentMethod(index)}
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

        {getIssueMessage(issues, ["salonProfile", "paymentMethods"]) ? (
          <p className="text-xs font-medium text-destructive">
            {getIssueMessage(issues, [
              "salonProfile",
              "paymentMethods",
            ])}
          </p>
        ) : null}

        <Button
          onClick={() =>
            onChange({
              ...value,
              paymentMethods: [...value.paymentMethods, ""],
            })
          }
          size="lg"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Aggiungi metodo
        </Button>
      </div>
    </div>
  );
}
interface ReadOnlyProfileItemProps {
  icon: typeof MapPin;
  label: string;
  value: string;
}

function ReadOnlyProfileItem({
  icon: Icon,
  label,
  value,
}: ReadOnlyProfileItemProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
