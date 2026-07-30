const integerFormatter = new Intl.NumberFormat("it-IT");
const currencyFormatter = new Intl.NumberFormat("it-IT", {
  currency: "EUR",
  style: "currency",
});

export const formatInteger = (value: number) => integerFormatter.format(value);

export const formatCurrencyCents = (value: number) =>
  currencyFormatter.format(value / 100);

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
