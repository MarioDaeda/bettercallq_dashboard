export interface VapiPublicConfig {
  assistantId: string;
  publicKey: string;
}

export class VapiConfigurationError extends Error {
  constructor() {
    super(
      "La chiamata di prova Vapi non è configurata. Imposta NEXT_PUBLIC_VAPI_PUBLIC_KEY e NEXT_PUBLIC_VAPI_ASSISTANT_ID.",
    );
    this.name = "VapiConfigurationError";
  }
}

export function isVapiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY &&
      process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
  );
}

export function getVapiPublicConfig(): VapiPublicConfig {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  if (!publicKey || !assistantId) {
    throw new VapiConfigurationError();
  }

  return { assistantId, publicKey };
}
