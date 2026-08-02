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

  it("mostra al proprietario soltanto tre sezioni di monitoraggio", () => {
    expect(
      getNavigationForRole("salon_owner").map((item) => item.label),
    ).toEqual(["Panoramica", "Chiamate", "WhatsApp"]);
  });

  it("non espone sezioni amministrative al proprietario", () => {
    const hrefs = getNavigationForRole("salon_owner").map(
      (item) => item.href,
    );

    expect(hrefs).not.toContain("/da-gestire");
    expect(hrefs).not.toContain("/dati-salone");
    expect(hrefs).not.toContain("/impostazioni-ia");
    expect(hrefs).not.toContain("/qr-e-canali");
    expect(hrefs).not.toContain("/monitoraggio");
  });

  it("risolve WhatsApp nel perimetro cliente", () => {
    expect(
      getNavigationItem("/whatsapp", "salon_owner").label,
    ).toBe("WhatsApp");

    expect(
      getNavigationItem("/monitoraggio", "admin").label,
    ).toBe("Monitoraggio");
  });
});
