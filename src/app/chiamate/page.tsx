import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Chiamate",
};

export default function CallsPage() {
  return (
    <SectionPlaceholder
      description="Rivedi esito, durata e sintesi delle chiamate gestite dalla receptionist senza dover consultare log tecnici."
      nextTask="La Task 6B"
      title="Ogni chiamata raccontata in modo semplice."
    />
  );
}
