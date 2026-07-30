export const formatCallDuration = (seconds: number | undefined) => {
  if (seconds === undefined) {
    return "Durata non disponibile";
  }
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0
    ? `${minutes} min`
    : `${minutes} min ${remainingSeconds} sec`;
};

export const formatTranscriptOffset = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatPhoneNumber = (value: string | undefined) => {
  if (value === undefined) {
    return "Numero non disponibile";
  }
  if (!value.startsWith("+39")) {
    return value;
  }

  const nationalNumber = value.slice(3);
  if (nationalNumber.length === 10) {
    return `+39 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
  }

  return `+39 ${nationalNumber}`;
};
