import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Da gestire",
};

export default function InterventionsPage() {
  return (
    <SectionPlaceholder
      description="Una sola coda per le situazioni che richiedono davvero una persona, ordinate per urgenza e provenienza."
      nextTask="La Task 6A"
      title="Le eccezioni importanti, tutte nello stesso posto."
    />
  );
}
