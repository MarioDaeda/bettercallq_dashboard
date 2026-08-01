import { describe, expect, it } from "vitest";

import { getSafeReturnTo, isPublicAuthPath } from "./paths";

describe("auth paths", () => {
  it("riconosce soltanto le route pubbliche di autenticazione", () => {
    expect(isPublicAuthPath("/accedi")).toBe(true);
    expect(isPublicAuthPath("/auth/callback")).toBe(true);
    expect(isPublicAuthPath("/monitoraggio")).toBe(false);
  });

  it("accetta solo destinazioni interne", () => {
    expect(getSafeReturnTo("/chiamate")).toBe("/chiamate");
    expect(getSafeReturnTo("https://example.com")).toBe("/");
    expect(getSafeReturnTo("//example.com")).toBe("/");
    expect(getSafeReturnTo("/\\example.com")).toBe("/");
  });
});
