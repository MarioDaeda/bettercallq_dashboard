export const formatInterventionAge = (
  createdAt: string,
  referenceTime: string,
) => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor(
      (Date.parse(referenceTime) - Date.parse(createdAt)) / (60 * 1000),
    ),
  );

  if (elapsedMinutes < 1) {
    return "adesso";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? "ora" : "ore"}`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? "giorno" : "giorni"}`;
};

export const formatDemoPhoneNumber = (value: string) => {
  if (!value.startsWith("+39") || value.length < 10) {
    return value;
  }

  const nationalNumber = value.slice(3);
  if (nationalNumber.length === 10) {
    return `+39 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
  }

  return `+39 ${nationalNumber}`;
};
