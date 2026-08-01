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

  it("limita il proprietario alle funzioni operative del salone", () => {
    expect(rolePermissions.salon_owner).toEqual([
      "overview:view",
      "interventions:view",
      "interventions:manage",
      "calls:view",
      "salon-settings:view",
      "salon-settings:edit",
    ]);
  });

  it("nega al proprietario configurazione tecnica e diagnostica", () => {
    expect(hasPermission("salon_owner", "ai-settings:manage")).toBe(false);
    expect(hasPermission("salon_owner", "channels:manage")).toBe(false);
    expect(hasPermission("salon_owner", "monitoring:view")).toBe(false);
    expect(hasPermission("salon_owner", "diagnostics:view")).toBe(false);
    expect(hasPermission("salon_owner", "users:manage")).toBe(false);
  });

  it("verifica insiemi di permessi senza duplicare logica nelle pagine", () => {
    expect(
      hasEveryPermission("salon_owner", [
        "interventions:view",
        "interventions:manage",
      ]),
    ).toBe(true);

    expect(
      hasEveryPermission("salon_owner", [
        "calls:view",
        "transcripts:view",
      ]),
    ).toBe(false);
  });
});
