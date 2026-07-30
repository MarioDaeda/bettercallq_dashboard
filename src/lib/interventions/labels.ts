import type {
  CallOutcome,
  InterventionPriority,
  InterventionReason,
  InterventionSource,
  InterventionStatus,
} from "@/lib/domain";

export const interventionPriorityLabels: Record<
  InterventionPriority,
  string
> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

export const interventionStatusLabels: Record<InterventionStatus, string> = {
  open: "Aperta",
  in_progress: "In lavorazione",
  resolved: "Risolta",
  dismissed: "Archiviata",
};

export const interventionSourceLabels: Record<InterventionSource, string> = {
  call: "Telefono",
  whatsapp: "WhatsApp",
  booking: "Prenotazione",
  integration: "Integrazione",
};

export const interventionReasonLabels: Record<InterventionReason, string> = {
  human_requested: "Richiesta di una persona",
  service_not_recognized: "Servizio non riconosciuto",
  availability_unavailable: "Disponibilità non verificabile",
  booking_incomplete: "Prenotazione incompleta",
  special_request: "Richiesta speciale",
  booking_sync_failed: "Sincronizzazione fallita",
  customer_dispute: "Contestazione del cliente",
  integration_error: "Errore di integrazione",
  other: "Altro",
};

export const callOutcomeLabels: Record<CallOutcome, string> = {
  booking_completed: "Prenotazione completata",
  information_provided: "Informazioni fornite",
  change_or_cancellation: "Modifica o cancellazione",
  transferred: "Trasferita",
  incomplete: "Richiesta incompleta",
  technical_error: "Errore tecnico",
  abandoned: "Abbandonata",
};

export const bookingSyncStatusLabels = {
  pending: "In attesa",
  synced: "Sincronizzata",
  failed: "Sincronizzazione fallita",
  cancelled: "Annullata",
} as const;

