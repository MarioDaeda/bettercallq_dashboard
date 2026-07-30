import type { ZodIssue } from "zod";

import type {
  FaqEntry,
  ReceptionistSettings,
  ServiceConfig,
  SpecialClosure,
  UpdateReceptionistSettingsInput,
  WeeklyOpeningHours,
} from "@/lib/domain";

export const settingsSections = [
  "profile",
  "services",
  "schedule",
  "faqs",
  "behavior",
  "escalation",
] as const;

export type SettingsSection = (typeof settingsSections)[number];
export type Weekday = keyof WeeklyOpeningHours;

export const settingsSectionLabels: Record<SettingsSection, string> = {
  profile: "Profilo salone",
  services: "Servizi",
  schedule: "Orari e chiusure",
  faqs: "FAQ",
  behavior: "Politiche e tono",
  escalation: "Prenotazioni ed escalation",
};

export const weekdayLabels: Record<Weekday, string> = {
  monday: "Lunedì",
  tuesday: "Martedì",
  wednesday: "Mercoledì",
  thursday: "Giovedì",
  friday: "Venerdì",
  saturday: "Sabato",
  sunday: "Domenica",
};

export const toneLabels = {
  warm: {
    label: "Caldo",
    description: "Accogliente e rassicurante, senza risultare informale.",
  },
  professional: {
    label: "Professionale",
    description: "Preciso, ordinato e orientato alle informazioni.",
  },
  friendly: {
    label: "Amichevole",
    description: "Naturale e vicino al linguaggio dei clienti abituali.",
  },
  concise: {
    label: "Conciso",
    description: "Risposte brevi, dirette e con pochi passaggi.",
  },
} satisfies Record<
  ReceptionistSettings["voiceAndTone"]["tone"],
  { description: string; label: string }
>;

export const toSettingsInput = (
  settings: ReceptionistSettings,
): UpdateReceptionistSettingsInput => ({
  salonProfile: structuredClone(settings.salonProfile),
  openingHours: structuredClone(settings.openingHours),
  closures: structuredClone(settings.closures),
  services: structuredClone(settings.services),
  faqs: structuredClone(settings.faqs),
  policies: structuredClone(settings.policies),
  escalation: structuredClone(settings.escalation),
  voiceAndTone: structuredClone(settings.voiceAndTone),
  bookingRules: structuredClone(settings.bookingRules),
});

export const settingsInputsEqual = (
  left: UpdateReceptionistSettingsInput,
  right: UpdateReceptionistSettingsInput,
) => JSON.stringify(left) === JSON.stringify(right);

export const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : undefined;
};

export const optionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

export const createServiceConfig = (
  createId: () => string = () => crypto.randomUUID(),
): ServiceConfig => ({
  id: createId(),
  name: "",
  aliases: [],
  enabled: true,
});

export const createFaqEntry = (
  sortOrder: number,
  createId: () => string = () => crypto.randomUUID(),
): FaqEntry => ({
  id: createId(),
  question: "",
  answer: "",
  enabled: true,
  sortOrder,
});

export const createSpecialClosure = (
  createId: () => string = () => crypto.randomUUID(),
): SpecialClosure => ({
  id: createId(),
  startsOn: "",
  endsOn: "",
  reason: "",
});

const sectionByTopLevelPath: Record<string, SettingsSection> = {
  salonProfile: "profile",
  services: "services",
  openingHours: "schedule",
  closures: "schedule",
  faqs: "faqs",
  policies: "behavior",
  voiceAndTone: "behavior",
  bookingRules: "escalation",
  escalation: "escalation",
};

export const getIssueSection = (
  issue: Pick<ZodIssue, "path">,
): SettingsSection =>
  sectionByTopLevelPath[String(issue.path[0])] ?? "profile";

export const getIssueMessage = (
  issues: ZodIssue[],
  path: PropertyKey[],
) =>
  issues.find(
    (issue) =>
      issue.path.length >= path.length &&
      path.every((part, index) => issue.path[index] === part),
  )?.message;

const fieldLabels: Record<string, string> = {
  salonProfile: "Profilo salone",
  description: "Descrizione",
  parkingInfo: "Parcheggio",
  paymentMethods: "Metodi di pagamento",
  openingHours: "Orari",
  opensAt: "Apertura",
  closesAt: "Chiusura",
  closures: "Chiusure straordinarie",
  startsOn: "Data iniziale",
  endsOn: "Data finale",
  reason: "Motivo",
  services: "Servizi",
  name: "Nome",
  aliases: "Nomi alternativi",
  durationMinutes: "Durata",
  priceCents: "Prezzo",
  faqs: "FAQ",
  question: "Domanda",
  answer: "Risposta",
  policies: "Politiche",
  cancellationNoticeHours: "Preavviso cancellazione",
  lateArrivalMinutes: "Tolleranza ritardo",
  notes: "Note",
  voiceAndTone: "Tono",
  bookingRules: "Regole di prenotazione",
  minimumNoticeMinutes: "Anticipo minimo",
  maximumAdvanceDays: "Prenotazione futura",
  preparationMinutes: "Tempo di preparazione",
  escalation: "Escalation",
  transferPhone: "Numero di trasferimento",
  reasons: "Condizioni di intervento",
};

export const formatIssuePath = (path: PropertyKey[]) =>
  path
    .filter((part) => typeof part !== "number")
    .map((part) => fieldLabels[String(part)] ?? String(part))
    .at(-1) ?? "Impostazioni";
