import { describe, expect, it } from "vitest";

import {
  getNavigationForRole,
  getNavigationItem,
} from "./navigation";

describe("role-aware navigation", () => {
  it("mantiene per l'admin tutte le sezioni tecniche esistenti", () => {
    expect(
      getNavigationForRole("admin").map((item) => item.label),
    ).toEqual([
      "Panoramica",
      "Da gestire",
      "WhatsApp",
      "Chiamate",
      "Impostazioni IA",
      "QR e canali",
      "Monitoraggio",
    ]);
  });

  it("mostra al proprietario soltanto quattro sezioni operative", () => {
    expect(
      getNavigationForRole("salon_owner").map((item) => item.label),
    ).toEqual([
      "Panoramica",
      "Da gestire",
      "Chiamate",
      "Dati del salone",
    ]);
  });

  it("non espone sezioni amministrative al proprietario", () => {
    const hrefs = getNavigationForRole("salon_owner").map(
      (item) => item.href,
    );

    expect(hrefs).not.toContain("/whatsapp");
    expect(hrefs).not.toContain("/impostazioni-ia");
    expect(hrefs).not.toContain("/qr-e-canali");
    expect(hrefs).not.toContain("/monitoraggio");
  });

  it("risolve la voce corrente nel perimetro del ruolo", () => {
    expect(
      getNavigationItem("/dati-salone", "salon_owner").label,
    ).toBe("Dati del salone");

    expect(
      getNavigationItem("/monitoraggio", "admin").label,
    ).toBe("Monitoraggio");
  });
});
