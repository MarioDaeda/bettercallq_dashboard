"use client";

import {
  CircleAlert,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isVapiConfigured } from "@/lib/vapi/config";
import { cn } from "@/lib/utils";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
}

const statusLabels: Record<CallStatus, string> = {
  idle: "Pronta per un test",
  connecting: "Connessione…",
  active: "Chiamata in corso",
  ended: "Chiamata terminata",
  error: "Errore",
};

export function VapiTestCallCard() {
  const configured = isVapiConfigured();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const vapiRef = useRef<InstanceType<
    typeof import("@vapi-ai/web").default
  > | null>(null);

  const getVapi = useCallback(async () => {
    if (vapiRef.current) {
      return vapiRef.current;
    }

    const { getVapiPublicConfig } = await import("@/lib/vapi/config");
    const { publicKey } = getVapiPublicConfig();
    const { default: Vapi } = await import("@vapi-ai/web");
    const vapi = new Vapi(publicKey);

    vapi.on("call-start", () => {
      setStatus("active");
      setErrorMessage(null);
    });
    vapi.on("call-end", () => {
      setStatus("ended");
      setIsAssistantSpeaking(false);
    });
    vapi.on("speech-start", () => setIsAssistantSpeaking(true));
    vapi.on("speech-end", () => setIsAssistantSpeaking(false));
    vapi.on("message", (message: unknown) => {
      const parsed = message as {
        type?: string;
        transcriptType?: string;
        role?: "assistant" | "user";
        transcript?: string;
      };

      if (
        parsed.type === "transcript" &&
        parsed.transcriptType === "final" &&
        parsed.role &&
        parsed.transcript
      ) {
        setTranscript((entries) => [
          ...entries,
          { role: parsed.role as "assistant" | "user", text: parsed.transcript as string },
        ]);
      }
    });
    vapi.on("error", (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Il microfono o la connessione con Vapi non hanno funzionato.";
      setErrorMessage(message);
      setStatus("error");
    });

    vapiRef.current = vapi;
    return vapi;
  }, []);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  const startCall = async () => {
    setStatus("connecting");
    setErrorMessage(null);
    setTranscript([]);

    try {
      const { getVapiPublicConfig } = await import("@/lib/vapi/config");
      const { assistantId } = getVapiPublicConfig();
      const vapi = await getVapi();
      await vapi.start(assistantId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile avviare la chiamata di prova.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  const endCall = () => {
    vapiRef.current?.stop();
    setStatus("ended");
  };

  const isActive = status === "active" || status === "connecting";

  if (!configured) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Chiamata di prova</CardTitle>
          <CardDescription>
            Testa la receptionist vocale direttamente dal browser prima di
            pubblicare le modifiche.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 rounded-2xl border border-warning/25 bg-warning/[0.07] p-4">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning"
            />
            <div>
              <p className="text-sm font-semibold">
                Vapi non è configurato
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Imposta <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> e{" "}
                <code>NEXT_PUBLIC_VAPI_ASSISTANT_ID</code> per attivare la
                chiamata di prova.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Chiamata di prova</CardTitle>
          <CardDescription>
            Parla con la receptionist dal microfono del browser: puoi
            simulare una chiamata e verificare prenotazioni e risposte.
          </CardDescription>
        </div>
        <Badge
          variant={
            status === "active"
              ? "success"
              : status === "error"
                ? "destructive"
                : "outline"
          }
        >
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isActive ? (
            <Button onClick={endCall} type="button" variant="destructive">
              {status === "connecting" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <PhoneOff aria-hidden="true" data-icon="inline-start" />
              )}
              Termina chiamata
            </Button>
          ) : (
            <Button onClick={() => void startCall()} type="button">
              <PhoneCall aria-hidden="true" data-icon="inline-start" />
              Avvia chiamata di prova
            </Button>
          )}

          {status === "active" ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isAssistantSpeaking ? (
                <>
                  <Mic
                    aria-hidden="true"
                    className="size-3.5 text-success"
                  />
                  La receptionist sta parlando…
                </>
              ) : (
                <>
                  <MicOff aria-hidden="true" className="size-3.5" />
                  In ascolto…
                </>
              )}
            </span>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] p-4">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {transcript.length > 0 ? (
          <div
            aria-live="polite"
            className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border bg-muted/30 p-3"
          >
            {transcript.map((entry, index) => (
              <p
                className={cn(
                  "text-xs leading-5",
                  entry.role === "assistant"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                key={index}
              >
                <span className="font-semibold">
                  {entry.role === "assistant" ? "Receptionist" : "Tu"}:
                </span>{" "}
                {entry.text}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
