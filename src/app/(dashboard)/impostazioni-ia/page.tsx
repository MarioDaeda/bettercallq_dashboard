import type { Metadata } from "next";

import { AiSettingsPageClient } from "@/components/settings/ai-settings-page-client";

export const metadata: Metadata = {
  title: "Impostazioni IA",
};

export default function AiSettingsPage() {
  return <AiSettingsPageClient />;
}
