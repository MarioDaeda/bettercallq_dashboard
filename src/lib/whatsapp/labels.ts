import type {
  ConversationControl,
  ConversationStatus,
  Message,
} from "@/lib/domain";

export const conversationStatusLabels: Record<
  ConversationStatus,
  string
> = {
  ai_handled: "Gestita dall’IA",
  needs_intervention: "Serve intervento",
  human_control: "Controllo del salone",
  waiting_customer: "In attesa del cliente",
  completed: "Completata",
};

export const conversationStatusDescriptions: Record<
  ConversationStatus,
  string
> = {
  ai_handled: "La receptionist può continuare a rispondere.",
  needs_intervention:
    "Le risposte automatiche sono in pausa finché interviene il salone.",
  human_control:
    "Il salone può inviare messaggi; la receptionist resta sospesa.",
  waiting_customer:
    "Il salone ha risposto e attende un nuovo messaggio del cliente.",
  completed: "La conversazione è chiusa e non accetta nuovi messaggi.",
};

export const conversationControlLabels: Record<
  ConversationControl,
  string
> = {
  ai: "IA",
  human: "Salone",
};

export const messageAuthorLabels: Record<Message["author"], string> = {
  customer: "Cliente",
  ai: "Receptionist IA",
  human: "Salone",
  system: "Sistema",
};

export const messageStatusLabels: Record<Message["status"], string> = {
  received: "Ricevuto",
  queued: "In coda",
  sent: "Inviato nella demo",
  delivered: "Consegnato",
  read: "Letto",
  failed: "Invio non riuscito",
};
