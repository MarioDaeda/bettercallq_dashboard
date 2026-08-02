import type { ClientCallData } from "./client-data";

export interface ClientCallPresentation {
  primaryLabel: string;
  secondaryPhone?: string;
  requestedService?: string;
  summary?: string;
}

export function resolveClientCallPresentation(
  call: ClientCallData,
): ClientCallPresentation {
  const customerName = call.customerName?.trim();
  const customerPhone = call.customerPhone?.trim();
  const requestedService = call.requestedService?.trim();
  const summary = call.summary?.trim();

  return {
    primaryLabel:
      customerName ||
      customerPhone ||
      "Cliente non identificato",
    secondaryPhone:
      customerName && customerPhone
        ? customerPhone
        : undefined,
    requestedService: requestedService || undefined,
    summary: summary || undefined,
  };
}
