import type {
  BookingProviderName,
  BookingSyncStatus,
  CallOutcome,
} from "@/lib/domain";

export const callOutcomeLabels: Record<CallOutcome, string> = {
  booking_completed: "Prenotazione completata",
  information_provided: "Informazioni fornite",
  change_or_cancellation: "Modifica o cancellazione",
  transferred: "Trasferita",
  incomplete: "Richiesta incompleta",
  technical_error: "Errore tecnico",
  abandoned: "Abbandonata",
};

export const callOutcomeDescriptions: Record<CallOutcome, string> = {
  booking_completed: "La receptionist ha completato la richiesta di prenotazione.",
  information_provided: "Il cliente ha ricevuto le informazioni richieste.",
  change_or_cancellation:
    "Il cliente ha chiesto di modificare o annullare un appuntamento.",
  transferred: "La conversazione è stata trasferita al salone.",
  incomplete: "Mancano informazioni necessarie per completare la richiesta.",
  technical_error: "Un passaggio tecnico non è stato completato correttamente.",
  abandoned: "La chiamata è terminata prima di raccogliere la richiesta.",
};

export const callProcessingStatusLabels = {
  receiving: "In elaborazione",
  processed: "Elaborata",
  failed: "Elaborazione non riuscita",
} as const;

export const transcriptSpeakerLabels = {
  customer: "Cliente",
  assistant: "Receptionist",
  system: "Sistema",
} as const;

export const bookingProviderLabels: Record<BookingProviderName, string> = {
  treatwell: "Treatwell",
  google_calendar: "Google Calendar",
  manual: "Riferimento manuale",
  unknown: "Provider da verificare",
};

export const bookingSyncStatusLabels: Record<BookingSyncStatus, string> = {
  pending: "In attesa",
  synced: "Sincronizzata",
  failed: "Sincronizzazione fallita",
  cancelled: "Annullata",
};
