import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Impostazioni IA",
};

export default function AiSettingsPage() {
  return (
    <SectionPlaceholder
      description="Configura informazioni, servizi, orari, politiche e tono della receptionist con moduli comprensibili."
      nextTask="La Task 7A"
      title="La receptionist segue le regole del tuo salone."
    />
  );
}
