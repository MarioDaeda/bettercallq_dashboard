import { describe, expect, it } from "vitest";

import { resolvePersistedIdentity } from "./persisted-identity";

const adminUser = {
  app_metadata: {},
  email: "ADMIN@example.com",
  id: "95e2a603-e534-4189-be8e-e090c842402f",
  user_metadata: {},
};

const ownerUser = {
  app_metadata: {},
  email: "owner@example.com",
  id: "90000000-0000-4000-8000-000000000001",
  user_metadata: {},
};

describe("persisted application identity", () => {
  it("risolve un amministratore senza membership", () => {
    expect(
      resolvePersistedIdentity(adminUser, [
        {
          user_id: adminUser.id,
          display_name: "Mario",
          platform_role: "admin",
          salon_id: null,
          membership_role: null,
        },
      ]),
    ).toEqual({
      displayName: "Mario",
      email: "admin@example.com",
      role: "admin",
      userId: adminUser.id,
    });
  });

  it("risolve il proprietario da una membership attiva", () => {
    expect(
      resolvePersistedIdentity(ownerUser, [
        {
          user_id: ownerUser.id,
          display_name: "Parrucchiere pilota",
          platform_role: "standard",
          salon_id: "10000000-0000-4000-8000-000000000001",
          membership_role: "owner",
        },
      ]),
    ).toEqual({
      displayName: "Parrucchiere pilota",
      email: "owner@example.com",
      role: "salon_owner",
      salonId: "10000000-0000-4000-8000-000000000001",
      userId: ownerUser.id,
    });
  });

  it("rifiuta un utente standard senza membership", () => {
    expect(resolvePersistedIdentity(ownerUser, [])).toBeNull();
  });

  it("rifiuta una selezione ambigua su più saloni", () => {
    const row = {
      user_id: ownerUser.id,
      display_name: "Parrucchiere pilota",
      platform_role: "standard",
      membership_role: "owner",
    };

    expect(
      resolvePersistedIdentity(ownerUser, [
        {
          ...row,
          salon_id: "10000000-0000-4000-8000-000000000001",
        },
        {
          ...row,
          salon_id: "10000000-0000-4000-8000-000000000002",
        },
      ]),
    ).toBeNull();
  });

  it("rifiuta il ruolo support finché non esiste la console dedicata", () => {
    expect(
      resolvePersistedIdentity(ownerUser, [
        {
          user_id: ownerUser.id,
          display_name: "Supporto",
          platform_role: "standard",
          salon_id: "10000000-0000-4000-8000-000000000001",
          membership_role: "support",
        },
      ]),
    ).toBeNull();
  });

  it("rifiuta righe appartenenti a un altro utente", () => {
    expect(
      resolvePersistedIdentity(ownerUser, [
        {
          user_id: "90000000-0000-4000-8000-000000000002",
          display_name: "Altro utente",
          platform_role: "standard",
          salon_id: "10000000-0000-4000-8000-000000000001",
          membership_role: "owner",
        },
      ]),
    ).toBeNull();
  });
});
