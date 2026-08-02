import { describe, expect, it } from "vitest";

import { resolveAppIdentity } from "./identity";

const baseUser = {
  id: "user-1",
  email: "Mario@example.com",
  user_metadata: {},
};

describe("resolveAppIdentity", () => {
  it("risolve un amministratore dai metadati non modificabili dall'utente", () => {
    expect(
      resolveAppIdentity({
        ...baseUser,
        app_metadata: {
          app_role: "admin",
          display_name: "Mario",
        },
      }),
    ).toEqual({
      displayName: "Mario",
      email: "mario@example.com",
      role: "admin",
      userId: "user-1",
    });
  });

  it("richiede il salone per un proprietario", () => {
    expect(
      resolveAppIdentity({
        ...baseUser,
        app_metadata: {
          app_role: "salon_owner",
        },
      }),
    ).toBeNull();
  });

  it("risolve un proprietario collegato al salone", () => {
    expect(
      resolveAppIdentity({
        ...baseUser,
        app_metadata: {
          app_role: "salon_owner",
          salon_id: "salon-pilot",
        },
      }),
    ).toMatchObject({
      role: "salon_owner",
      salonId: "salon-pilot",
    });
  });

  it("nega utenti autenticati privi di ruolo applicativo", () => {
    expect(
      resolveAppIdentity({
        ...baseUser,
        app_metadata: {},
      }),
    ).toBeNull();
  });
});
