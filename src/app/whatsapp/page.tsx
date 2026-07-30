import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "WhatsApp",
};

export default function WhatsAppPage() {
  return (
    <SectionPlaceholder
      description="Consulta le conversazioni dimostrative e, quando serve, passa con chiarezza dal controllo dell’IA a quello del salone."
      nextTask="La Task 6C"
      title="Conversazioni chiare, controllo sempre visibile."
    />
  );
}
