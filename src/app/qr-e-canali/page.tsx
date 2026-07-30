import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "QR e canali",
};

export default function ChannelsPage() {
  return (
    <SectionPlaceholder
      description="Trova numeri, stato delle connessioni e strumenti per rendere il contatto WhatsApp immediato."
      nextTask="La Task 7B"
      title="Tutti i canali BetterCallQ, pronti da condividere."
    />
  );
}
