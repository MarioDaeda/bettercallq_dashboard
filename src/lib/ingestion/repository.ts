import {
  vapiCallIngestionSchema,
  vapiIngestionResultSchema,
  whatsappConversationIngestionSchema,
  whatsappIngestionResultSchema,
  type VapiCallIngestion,
  type VapiIngestionResult,
  type WhatsAppConversationIngestion,
  type WhatsAppIngestionResult,
} from "./contracts";

interface RpcError {
  message: string;
}

export interface IngestionRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, unknown>,
  ): Promise<{
    data: unknown;
    error: RpcError | null;
  }>;
}

export class IngestionRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionRepositoryError";
  }
}

export async function ingestVapiCall(
  client: IngestionRpcClient,
  input: VapiCallIngestion,
): Promise<VapiIngestionResult> {
  const payload = vapiCallIngestionSchema.parse(input);
  const { data, error } = await client.rpc(
    "ingest_vapi_call",
    {
      p_customer_name: payload.customerName,
      p_customer_phone: payload.customerPhone,
      p_duration_seconds: payload.durationSeconds,
      p_ended_at: payload.endedAt,
      p_external_call_id: payload.externalCallId,
      p_external_event_id: payload.externalEventId,
      p_outcome: payload.outcome,
      p_processing_status: payload.processingStatus,
      p_requested_service: payload.requestedService,
      p_salon_id: payload.salonId,
      p_started_at: payload.startedAt,
      p_summary: payload.summary,
    },
  );

  if (error) {
    throw new IngestionRepositoryError(
      `Ingestione Vapi fallita: ${error.message}`,
    );
  }

  return vapiIngestionResultSchema.parse(data);
}

export async function ingestWhatsAppConversation(
  client: IngestionRpcClient,
  input: WhatsAppConversationIngestion,
): Promise<WhatsAppIngestionResult> {
  const payload =
    whatsappConversationIngestionSchema.parse(input);
  const { data, error } = await client.rpc(
    "ingest_whatsapp_conversation",
    {
      p_control: payload.control,
      p_customer_name: payload.customerName,
      p_customer_phone: payload.customerPhone,
      p_external_conversation_key:
        payload.externalConversationKey,
      p_external_event_id: payload.externalEventId,
      p_last_message_at: payload.lastMessageAt,
      p_salon_id: payload.salonId,
      p_status: payload.status,
      p_summary: payload.summary,
    },
  );

  if (error) {
    throw new IngestionRepositoryError(
      `Ingestione WhatsApp fallita: ${error.message}`,
    );
  }

  return whatsappIngestionResultSchema.parse(data);
}
