import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Monitoraggio",
};

export default function MonitoringPage() {
  return (
    <SectionPlaceholder
      description="Leggi volumi, qualità, interventi, errori e costo stimato con metriche pensate per il salone."
      nextTask="La Task 7C"
      title="Numeri utili, senza una console tecnica."
    />
  );
}
