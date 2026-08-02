const integerFormatter = new Intl.NumberFormat("it-IT");
const usdFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 4,
  minimumFractionDigits: 2,
});

export const formatInteger = (value: number) => integerFormatter.format(value);

export const formatUsdMicros = (value: number) =>
  `$${usdFormatter.format(value / 1_000_000)}`;

export const formatLocalDate = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));

export const formatDateTime = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone,
  }).format(new Date(value));
