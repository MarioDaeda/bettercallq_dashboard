export const formatMessageTime = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));

export const formatConversationActivity = (
  value: string,
  referenceTime: string,
) => {
  const difference = Math.max(
    0,
    Date.parse(referenceTime) - Date.parse(value),
  );
  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) {
    return "adesso";
  }
  if (minutes < 60) {
    return `${minutes} min fa`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
};
