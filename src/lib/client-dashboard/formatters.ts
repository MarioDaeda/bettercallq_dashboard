import type {
  CallOutcome,
  ConversationStatus,
  HealthStatus,
} from "@/lib/domain";

const callOutcomeLabels: Record<CallOutcome, string> = {
  booking_completed: "Appuntamento fissato",
  information_provided: "Informazioni fornite",
  change_or_cancellation: "Modifica o cancellazione",
  transferred: "Passata al salone",
  incomplete: "Non completata",
  technical_error: "Problema tecnico",
  abandoned: "Interrotta",
};

const conversationStatusLabels: Record<ConversationStatus, string> = {
  ai_handled: "Gestita automaticamente",
  needs_intervention: "Passata al salone",
  human_control: "Gestita dal salone",
  waiting_customer: "In attesa del cliente",
  completed: "Completata",
};

const healthStatusLabels: Record<HealthStatus, string> = {
  operational: "Operativo",
  degraded: "Da verificare",
  offline: "Temporaneamente non disponibile",
  not_configured: "Configurazione in corso",
};

export function formatClientDateTime(
  value: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatCallDuration(seconds?: number): string {
  if (!seconds) {
    return "0 min";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

export function getCallOutcomeLabel(outcome: CallOutcome): string {
  return callOutcomeLabels[outcome];
}

export function getConversationStatusLabel(
  status: ConversationStatus,
): string {
  return conversationStatusLabels[status];
}

export function getHealthStatusLabel(status: HealthStatus): string {
  return healthStatusLabels[status];
}
