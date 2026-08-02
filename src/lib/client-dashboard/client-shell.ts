import type {
  ChannelStatus,
  Salon,
} from "@/lib/domain";

import type { ClientDashboardSnapshot } from "./client-data";

export interface ClientShellState {
  channels: ChannelStatus[];
  salon: Salon;
  showDemoNotice: boolean;
}

export function buildClientShellState(
  fixtureSalon: Salon,
  fixtureChannels: ChannelStatus[],
  snapshot: ClientDashboardSnapshot,
): ClientShellState {
  const channels = fixtureChannels.map((fixtureChannel) => {
    const realChannel = snapshot.channels.find(
      (channel) =>
        channel.channel === fixtureChannel.channel,
    );

    if (!realChannel) {
      return fixtureChannel;
    }

    return {
      ...fixtureChannel,
      checkedAt: realChannel.checkedAt,
      lastSuccessfulEventAt:
        realChannel.lastSuccessfulEventAt,
      message:
        realChannel.publicMessage ??
        fixtureChannel.message,
      status: realChannel.status,
    };
  });

  return {
    channels,
    salon: {
      ...fixtureSalon,
      name: snapshot.salon.name,
      timezone: snapshot.salon.timezone,
    },
    showDemoNotice: snapshot.source === "fixtures",
  };
}
