"use client";

import {
  CalendarDays,
  Check,
  Clipboard,
  Clock3,
  Download,
  ExternalLink,
  Info,
  LoaderCircle,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toDataURL, toString } from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  SettingsInput,
  SettingsTextarea,
} from "@/components/settings/settings-controls";
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
  ChannelKind,
  ChannelStatus,
  HealthStatus,
  Salon,
} from "@/lib/domain";
import {
  buildQrDownloadName,
  buildWhatsAppLink,
  DEFAULT_WHATSAPP_MESSAGE,
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/lib/channels/whatsapp-link";
import { formatDateTime } from "@/lib/overview/formatters";
import { cn } from "@/lib/utils";

interface ChannelsPageClientProps {
  channels: ChannelStatus[];
  salon: Salon;
}

type QrState =
  | { status: "idle" }
  | {
      status: "ready";
      attempt: number;
      source: string;
      pngDataUrl: string;
      svg: string;
    }
  | { status: "error"; attempt: number; source: string; message: string };

type QrViewState = QrState | { status: "loading" };

const channelMeta: Record<
  ChannelKind,
  { description: string; icon: LucideIcon; label: string }
> = {
  vapi: {
    description: "Numero vocale e ricezione delle chiamate.",
    icon: Phone,
    label: "Telefono",
  },
  whatsapp: {
    description: "Conversazioni e conferme via WhatsApp.",
    icon: MessageCircle,
    label: "WhatsApp",
  },
  booking_provider: {
    description: "Disponibilità e gestione degli appuntamenti.",
    icon: CalendarDays,
    label: "Agenda appuntamenti",
  },
};

const healthMeta: Record<
  HealthStatus,
  {
    badge: "success" | "warning" | "destructive" | "outline";
    label: string;
    surface: string;
  }
> = {
  operational: {
    badge: "success",
    label: "Operativo",
    surface: "bg-success/10 text-success",
  },
  degraded: {
    badge: "warning",
    label: "Da controllare",
    surface: "bg-warning/15 text-warning-foreground dark:text-warning",
  },
  offline: {
    badge: "destructive",
    label: "Non disponibile",
    surface: "bg-destructive/10 text-destructive",
  },
  not_configured: {
    badge: "outline",
    label: "Da collegare",
    surface: "bg-muted text-muted-foreground",
  },
};

function downloadBlob(content: BlobPart, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Copia non disponibile");
  }
}

export function ChannelsPageClient({
  channels,
  salon,
}: ChannelsPageClientProps) {
  const [phoneNumber, setPhoneNumber] = useState(salon.whatsappNumber ?? "");
  const [message, setMessage] = useState(DEFAULT_WHATSAPP_MESSAGE);
  const [qrState, setQrState] = useState<QrState>({ status: "idle" });
  const [qrRetry, setQrRetry] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const normalizedPhone = normalizeInternationalPhone(phoneNumber);
  const phoneIsValid = isValidInternationalPhone(normalizedPhone);
  const whatsAppLink = useMemo(() => {
    if (!phoneIsValid) {
      return null;
    }

    return buildWhatsAppLink(normalizedPhone, message);
  }, [message, normalizedPhone, phoneIsValid]);

  const displayedQrState = useMemo<QrViewState>(() => {
    if (!whatsAppLink) {
      return { status: "idle" };
    }

    if (
      qrState.status !== "idle" &&
      qrState.source === whatsAppLink &&
      qrState.attempt === qrRetry
    ) {
      return qrState;
    }

    return { status: "loading" };
  }, [qrRetry, qrState, whatsAppLink]);

  useEffect(() => {
    if (!whatsAppLink) {
      return;
    }

    let cancelled = false;
    const attempt = qrRetry;
    const source = whatsAppLink;

    void Promise.all([
      toDataURL(whatsAppLink, {
        color: { dark: "#241c3dff", light: "#ffffffff" },
        errorCorrectionLevel: "M",
        margin: 2,
        width: 1024,
      }),
      toString(whatsAppLink, {
        color: { dark: "#241c3dff", light: "#ffffffff" },
        errorCorrectionLevel: "M",
        margin: 2,
        type: "svg",
        width: 1024,
      }),
    ])
      .then(([pngDataUrl, svg]) => {
        if (!cancelled) {
          setQrState({
            status: "ready",
            attempt,
            source,
            pngDataUrl,
            svg,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrState({
            status: "error",
            attempt,
            source,
            message:
              "Il QR non è stato generato. Controlla numero e messaggio e riprova.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrRetry, whatsAppLink]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setCopyState("idle"), 2_500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const operationalCount = channels.filter(
    (channel) => channel.status === "operational",
  ).length;
  const whatsappStatus = channels.find(
    (channel) => channel.channel === "whatsapp",
  );

  const handleCopy = async () => {
    if (!whatsAppLink) {
      return;
    }

    try {
      await copyText(whatsAppLink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        badge="QR e canali · dati dimostrativi"
        description="Controlla i collegamenti del salone e prepara un contatto WhatsApp condivisibile senza token Meta o servizi QR esterni."
        title="Tutti i canali BetterCallQ, pronti da condividere."
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Numeri del salone</CardTitle>
              <CardDescription className="mt-1">
                Riferimenti configurati nella fixture del salone pilota.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {salon.status === "trial"
                ? "Prova"
                : salon.status === "active"
                  ? "Attivo"
                  : "Sospeso"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <NumberRow
              icon={Phone}
              label="Numero receptionist"
              value={salon.phoneNumber}
            />
            <NumberRow
              icon={MessageCircle}
              label="Numero WhatsApp"
              value={salon.whatsappNumber}
            />
            <div className="flex items-start gap-2 rounded-2xl border bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              I numeri mostrati sono dimostrativi. Il generatore sottostante può
              essere testato con un numero reale in formato internazionale.
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Stato dei canali</CardTitle>
              <CardDescription className="mt-1">
                Ultima verifica disponibile nel service mock.
              </CardDescription>
            </div>
            <Badge
              variant={
                channels.length > 0 && operationalCount === channels.length
                  ? "success"
                  : "outline"
              }
            >
              {operationalCount}/{channels.length} operativi
            </Badge>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nessuno stato canale disponibile.
              </div>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {channels.map((channel) => (
                  <ChannelRow
                    channel={channel}
                    key={channel.id}
                    timeZone={salon.timezone}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/15">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Generatore link e QR WhatsApp</CardTitle>
              <CardDescription className="mt-1 max-w-3xl">
                Il QR viene rigenerato nel browser ogni volta che cambiano il
                numero o il messaggio. Nessun contenuto viene inviato a Meta
                durante la generazione.
              </CardDescription>
            </div>
            <Badge
              variant={
                whatsappStatus?.status === "operational" ? "success" : "warning"
              }
            >
              {whatsappStatus?.status === "operational"
                ? "Canale operativo"
                : "Test locale"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-7 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="whatsapp-number">
                Numero WhatsApp
              </label>
              <SettingsInput
                aria-describedby="whatsapp-number-help"
                aria-invalid={!phoneIsValid}
                autoComplete="tel"
                id="whatsapp-number"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+393331234567"
                value={phoneNumber}
              />
              <p
                className={cn(
                  "text-xs leading-5",
                  phoneIsValid ? "text-muted-foreground" : "text-destructive",
                )}
                id="whatsapp-number-help"
              >
                {phoneIsValid
                  ? `Numero normalizzato: ${normalizedPhone}`
                  : "Usa il formato internazionale con + e prefisso paese, ad esempio +393331234567."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium" htmlFor="whatsapp-message">
                  Messaggio precompilato
                </label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {message.length}/500
                </span>
              </div>
              <SettingsTextarea
                id="whatsapp-message"
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Scrivi il messaggio che il cliente troverà già compilato."
                value={message}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Il cliente potrà modificare il testo prima di inviarlo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="whatsapp-link">
                Link generato
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SettingsInput
                  className="font-mono text-xs"
                  id="whatsapp-link"
                  readOnly
                  value={whatsAppLink ?? "Correggi il numero per generare il link"}
                />
                <Button
                  disabled={!whatsAppLink}
                  onClick={handleCopy}
                  type="button"
                  variant="outline"
                >
                  {copyState === "copied" ? (
                    <Check aria-hidden="true" data-icon="inline-start" />
                  ) : (
                    <Clipboard aria-hidden="true" data-icon="inline-start" />
                  )}
                  {copyState === "copied"
                    ? "Copiato"
                    : copyState === "error"
                      ? "Copia fallita"
                      : "Copia link"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {whatsAppLink ? (
                <Button asChild>
                  <a
                    href={whatsAppLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" data-icon="inline-start" />
                    Testa il link
                  </a>
                </Button>
              ) : (
                <Button disabled type="button">
                  <ExternalLink aria-hidden="true" data-icon="inline-start" />
                  Testa il link
                </Button>
              )}

              <Button
                disabled={displayedQrState.status !== "ready"}
                onClick={() => {
                  if (displayedQrState.status === "ready") {
                    downloadDataUrl(
                      displayedQrState.pngDataUrl,
                      buildQrDownloadName(salon.name, "png"),
                    );
                  }
                }}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" data-icon="inline-start" />
                Scarica PNG
              </Button>

              <Button
                disabled={displayedQrState.status !== "ready"}
                onClick={() => {
                  if (displayedQrState.status === "ready") {
                    downloadBlob(
                      displayedQrState.svg,
                      "image/svg+xml;charset=utf-8",
                      buildQrDownloadName(salon.name, "svg"),
                    );
                  }
                }}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" data-icon="inline-start" />
                Scarica SVG
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-muted/20 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Anteprima QR</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alta risoluzione per stampa e materiali digitali.
                </p>
              </div>
              <QrCode aria-hidden="true" className="size-5 text-primary" />
            </div>

            <div className="grid min-h-80 place-items-center rounded-3xl border bg-white p-5 shadow-sm">
              {displayedQrState.status === "loading" ? (
                <div className="text-center text-sm text-slate-600">
                  <LoaderCircle
                    aria-hidden="true"
                    className="mx-auto mb-3 size-7 animate-spin"
                  />
                  Generazione del QR…
                </div>
              ) : displayedQrState.status === "ready" ? (
                // L'immagine è prodotta localmente dalla libreria qrcode.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`QR WhatsApp di ${salon.name}`}
                  className="aspect-square w-full max-w-72"
                  height={1024}
                  src={displayedQrState.pngDataUrl}
                  width={1024}
                />
              ) : displayedQrState.status === "error" ? (
                <ErrorState
                  description={displayedQrState.message}
                  onRetry={() => setQrRetry((value) => value + 1)}
                  title="QR non disponibile"
                />
              ) : (
                <div className="max-w-xs text-center text-sm leading-6 text-slate-600">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mx-auto mb-3 size-7 text-amber-600"
                  />
                  Inserisci un numero internazionale valido per generare il QR.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-success"
              />
              Il QR contiene soltanto il link costruito dal numero e dal testo
              visibili in questa pagina.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <GuideStep
            description="Sostituisci il numero dimostrativo con il numero WhatsApp Business del salone."
            index="1"
            title="Controlla il numero"
          />
          <GuideStep
            description="Personalizza il testo che il cliente troverà già pronto nella chat."
            index="2"
            title="Prepara il messaggio"
          />
          <GuideStep
            description="Apri il link su un dispositivo e scarica il formato adatto alla stampa."
            index="3"
            title="Testa e condividi"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function NumberRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3.5">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm font-semibold">
          {value ?? "Non configurato"}
        </p>
      </div>
    </div>
  );
}

function ChannelRow({
  channel,
  timeZone,
}: {
  channel: ChannelStatus;
  timeZone: string;
}) {
  const meta = channelMeta[channel.channel];
  const health = healthMeta[channel.status];
  const Icon = meta.icon;

  return (
    <li className="rounded-2xl border p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            health.surface,
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </div>
        <Badge variant={health.badge}>{health.label}</Badge>
      </div>
      <p className="mt-3 text-sm font-semibold">{meta.label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {channel.message ?? meta.description}
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <Clock3 aria-hidden="true" className="size-3.5" />
        {formatDateTime(channel.checkedAt, timeZone)}
      </p>
    </li>
  );
}

function GuideStep({
  description,
  index,
  title,
}: {
  description: string;
  index: string;
  title: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
        {index}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
