import type { Metadata } from "next";

import { AiSettingsPageClient } from "@/components/settings/ai-settings-page-client";
import { requireAppSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Impostazioni IA",
};

export default async function AiSettingsPage() {
  const session = await requireAppSession();

  return <AiSettingsPageClient platformRole={session.role} />;
}
