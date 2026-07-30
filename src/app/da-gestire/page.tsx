import type { Metadata } from "next";

import { InterventionsPageClient } from "@/components/interventions/interventions-page-client";

export const metadata: Metadata = {
  title: "Da gestire",
};

export default function InterventionsPage() {
  return <InterventionsPageClient />;
}
