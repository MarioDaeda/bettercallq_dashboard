import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Panoramica",
};

export default function OverviewPage() {
  return (
    <SectionPlaceholder
      description="Controlla in pochi secondi lo stato della receptionist, le richieste da seguire e ciò che BetterCallQ ha gestito per il salone."
      nextTask="La Task 5"
      title="Il salone, sotto controllo a colpo d’occhio."
    />
  );
}
