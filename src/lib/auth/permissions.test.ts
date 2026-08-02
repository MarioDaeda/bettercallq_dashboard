import { describe, expect, it } from "vitest";

import {
  appRoles,
  getPermissionsForRole,
  hasEveryPermission,
  hasPermission,
  permissions,
  rolePermissions,
} from "./permissions";

describe("role permissions", () => {
  it("mantiene soltanto i due ruoli previsti dal pilota", () => {
    expect(appRoles).toEqual(["admin", "salon_owner"]);
  });

  it("assegna all'admin tutti i permessi registrati", () => {
    expect(getPermissionsForRole("admin")).toEqual(permissions);

    for (const permission of permissions) {
      expect(hasPermission("admin", permission)).toBe(true);
    }
  });

  it("limita il proprietario al monitoraggio essenziale", () => {
    expect(rolePermissions.salon_owner).toEqual([
      "overview:view",
      "calls:view",
      "whatsapp:view",
    ]);
  });

  it("nega al proprietario gestione tecnica e dati sensibili", () => {
    expect(hasPermission("salon_owner", "interventions:view")).toBe(false);
    expect(hasPermission("salon_owner", "transcripts:view")).toBe(false);
    expect(hasPermission("salon_owner", "whatsapp:manage")).toBe(false);
    expect(hasPermission("salon_owner", "salon-settings:edit")).toBe(false);
    expect(hasPermission("salon_owner", "monitoring:view")).toBe(false);
    expect(hasPermission("salon_owner", "diagnostics:view")).toBe(false);
  });

  it("permette la consultazione voce e WhatsApp senza gestione", () => {
    expect(
      hasEveryPermission("salon_owner", [
        "overview:view",
        "calls:view",
        "whatsapp:view",
      ]),
    ).toBe(true);

    expect(
      hasEveryPermission("salon_owner", [
        "whatsapp:view",
        "whatsapp:manage",
      ]),
    ).toBe(false);
  });
});
