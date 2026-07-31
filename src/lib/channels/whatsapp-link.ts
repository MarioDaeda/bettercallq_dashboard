const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export const DEFAULT_WHATSAPP_MESSAGE =
  "Ciao, vorrei informazioni e disponibilità per un appuntamento.";

export function normalizeInternationalPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");

  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }

  return compact;
}

export function isValidInternationalPhone(value: string): boolean {
  return E164_PATTERN.test(normalizeInternationalPhone(value));
}

export function buildWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  const normalizedPhone = normalizeInternationalPhone(phoneNumber);

  if (!E164_PATTERN.test(normalizedPhone)) {
    throw new Error(
      "Il numero WhatsApp deve essere in formato internazionale, ad esempio +393331234567.",
    );
  }

  const recipient = normalizedPhone.slice(1);
  const normalizedMessage = message.trim();
  const baseUrl = `https://wa.me/${recipient}`;

  return normalizedMessage
    ? `${baseUrl}?text=${encodeURIComponent(normalizedMessage)}`
    : baseUrl;
}

export function buildQrDownloadName(salonName: string, extension: "png" | "svg") {
  const slug = salonName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bettercallq";

  return `${slug}-whatsapp-qr.${extension}`;
}
