import { describe, expect, it } from "vitest";

import type { ClientCallData } from "./client-data";
import { resolveClientCallPresentation } from "./call-presentation";

const baseCall: ClientCallData = {
  customerName: "Test BetterCallQ",
  customerPhone: "+393330000000",
  durationSeconds: 90,
  endedAt: "2026-08-02T15:25:34.735Z",
  id: "10a0fd3f-e0bf-428b-850a-925e3f838238",
  outcome: "information_provided",
  processingStatus: "processed",
  requestedService: "Informazioni",
  startedAt: "2026-08-02T15:24:04.735Z",
  summary:
    "Test tecnico BetterCallQ: richiesta informazioni sugli orari.",
};

describe("presentazione chiamata cliente", () => {
  it("mostra nome, numero, servizio e riepilogo", () => {
    expect(resolveClientCallPresentation(baseCall)).toEqual({
      primaryLabel: "Test BetterCallQ",
      requestedService: "Informazioni",
      secondaryPhone: "+393330000000",
      summary:
        "Test tecnico BetterCallQ: richiesta informazioni sugli orari.",
    });
  });

  it("usa il numero come etichetta primaria quando manca il nome", () => {
    expect(
      resolveClientCallPresentation({
        ...baseCall,
        customerName: undefined,
      }),
    ).toEqual({
      primaryLabel: "+393330000000",
      requestedService: "Informazioni",
      secondaryPhone: undefined,
      summary:
        "Test tecnico BetterCallQ: richiesta informazioni sugli orari.",
    });
  });

  it("gestisce una chiamata priva di dati cliente", () => {
    expect(
      resolveClientCallPresentation({
        ...baseCall,
        customerName: undefined,
        customerPhone: undefined,
        requestedService: undefined,
        summary: undefined,
      }),
    ).toEqual({
      primaryLabel: "Cliente non identificato",
      requestedService: undefined,
      secondaryPhone: undefined,
      summary: undefined,
    });
  });
});
