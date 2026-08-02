import type { Metadata } from "next";

import { ChannelsPageClient } from "@/components/channels/channels-page-client";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const metadata: Metadata = {
  title: "QR e canali",
};

export default async function ChannelsPage() {
  const [salon, channels] = await Promise.all([
    dashboardService.getSalon(PILOT_SALON_ID),
    dashboardService.getChannelStatuses(PILOT_SALON_ID),
  ]);

  return <ChannelsPageClient channels={channels} salon={salon} />;
}
