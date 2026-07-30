import { describe, expect, it } from "vitest";

import {
  receptionistSettingsSchema,
  updateReceptionistSettingsInputSchema,
} from "@/lib/domain";
import { pilotFixtureSet } from "@/lib/fixtures/pilot-salon";

import {
  createFaqEntry,
  createServiceConfig,
  createSpecialClosure,
  toSettingsInput,
} from "./settings";

describe("impostazioni receptionist", () => {
  it("estrae soltanto i campi modificabili", () => {
    const input = toSettingsInput(pilotFixtureSet.receptionistSettings);

    expect(updateReceptionistSettingsInputSchema.parse(input)).toEqual(input);
    expect(input).not.toHaveProperty("id");
    expect(input).not.toHaveProperty("version");
    expect(input).not.toHaveProperty("publishedAt");
  });

  it("rifiuta fasce invertite o sovrapposte", () => {
    const base = toSettingsInput(pilotFixtureSet.receptionistSettings);
    const inverted = structuredClone(base);
    const overlapping = structuredClone(base);

    inverted.openingHours.monday = [
      { opensAt: "12:00", closesAt: "09:00" },
    ];
    overlapping.openingHours.monday = [
      { opensAt: "09:00", closesAt: "13:00" },
      { opensAt: "12:30", closesAt: "18:00" },
    ];

    expect(updateReceptionistSettingsInputSchema.safeParse(inverted).success).toBe(
      false,
    );
    expect(
      updateReceptionistSettingsInputSchema.safeParse(overlapping).success,
    ).toBe(false);
  });

  it("rifiuta chiusure invertite e servizi con lo stesso nome", () => {
    const base = toSettingsInput(pilotFixtureSet.receptionistSettings);
    const invalid = structuredClone(base);

    invalid.closures[0].startsOn = "2026-08-20";
    invalid.closures[0].endsOn = "2026-08-19";
    invalid.services[1].name = invalid.services[0].name.toUpperCase();

    const result = updateReceptionistSettingsInputSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining(["closures.0.endsOn", "services.1.name"]),
      );
    }
  });

  it("crea nuove righe con identificatori e ordine validi", () => {
    const ids = [
      "74000000-0000-4000-8000-000000000001",
      "74000000-0000-4000-8000-000000000002",
      "74000000-0000-4000-8000-000000000003",
    ];

    const service = createServiceConfig(() => ids[0]);
    const faq = createFaqEntry(3, () => ids[1]);
    const closure = createSpecialClosure(() => ids[2]);

    expect(service).toMatchObject({ id: ids[0], enabled: true });
    expect(faq).toMatchObject({ id: ids[1], enabled: true, sortOrder: 3 });
    expect(closure).toMatchObject({ id: ids[2] });
    expect(() =>
      receptionistSettingsSchema.parse(pilotFixtureSet.receptionistSettings),
    ).not.toThrow();
  });
});
