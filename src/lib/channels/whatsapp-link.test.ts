import { describe, expect, it } from "vitest";

import {
  buildQrDownloadName,
  buildWhatsAppLink,
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "./whatsapp-link";

describe("WhatsApp link helpers", () => {
  it("normalizza spazi, separatori e prefisso 00", () => {
    expect(normalizeInternationalPhone("0039 333-123 4567")).toBe(
      "+393331234567",
    );
  });

  it("valida soltanto numeri internazionali E.164", () => {
    expect(isValidInternationalPhone("+393331234567")).toBe(true);
    expect(isValidInternationalPhone("3331234567")).toBe(false);
    expect(isValidInternationalPhone("+390")).toBe(false);
  });

  it("genera un link wa.me con testo codificato", () => {
    expect(
      buildWhatsAppLink(
        "+39 333 123 4567",
        "Ciao, vorrei prenotare\nun taglio.",
      ),
    ).toBe(
      "https://wa.me/393331234567?text=Ciao%2C%20vorrei%20prenotare%0Aun%20taglio.",
    );
  });

  it("genera il link senza parametro text quando il messaggio è vuoto", () => {
    expect(buildWhatsAppLink("+393331234567", "   ")).toBe(
      "https://wa.me/393331234567",
    );
  });

  it("rifiuta numeri non validi", () => {
    expect(() => buildWhatsAppLink("3331234567", "Ciao")).toThrow(
      /formato internazionale/,
    );
  });

  it("crea nomi file leggibili e sicuri", () => {
    expect(buildQrDownloadName("Studio Chioma Demo", "svg")).toBe(
      "studio-chioma-demo-whatsapp-qr.svg",
    );
  });
});
