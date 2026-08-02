import type { Call } from "@/lib/domain";

export const DEFAULT_INCLUDED_VOICE_MINUTES = 300;

export interface CalendarMonthRange {
  from: string;
  to: string;
}

export interface VoicePlanUsage {
  includedMinutes: number;
  includedSeconds: number;
  usedSeconds: number;
  includedSecondsUsed: number;
  remainingSeconds: number;
  extraSeconds: number;
  usagePercentage: number;
}

type UsageCall = Pick<Call, "durationSeconds">;

export function calculateVoicePlanUsage(
  calls: readonly UsageCall[],
  includedMinutes = DEFAULT_INCLUDED_VOICE_MINUTES,
): VoicePlanUsage {
  if (!Number.isFinite(includedMinutes) || includedMinutes <= 0) {
    throw new RangeError("I minuti inclusi devono essere maggiori di zero.");
  }

  const includedSeconds = Math.round(includedMinutes * 60);
  const usedSeconds = calls.reduce(
    (total, call) => total + Math.max(call.durationSeconds ?? 0, 0),
    0,
  );
  const includedSecondsUsed = Math.min(usedSeconds, includedSeconds);
  const remainingSeconds = Math.max(includedSeconds - usedSeconds, 0);
  const extraSeconds = Math.max(usedSeconds - includedSeconds, 0);

  return {
    includedMinutes,
    includedSeconds,
    usedSeconds,
    includedSecondsUsed,
    remainingSeconds,
    extraSeconds,
    usagePercentage: Math.min(
      (usedSeconds / includedSeconds) * 100,
      100,
    ),
  };
}

export function resolveCalendarMonthRange(
  reportingDate: string,
): CalendarMonthRange {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(reportingDate);

  if (!match) {
    throw new RangeError("La data di rendicontazione non è valida.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const parsed = new Date(Date.UTC(year, monthIndex, Number(match[3])));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex
  ) {
    throw new RangeError("La data di rendicontazione non è valida.");
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export function isDateTimeInRange(
  dateTime: string,
  range: CalendarMonthRange,
): boolean {
  const date = dateTime.slice(0, 10);
  return date >= range.from && date <= range.to;
}

export function formatVoiceMinutes(seconds: number): string {
  const minutes = Math.max(seconds, 0) / 60;

  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: Number.isInteger(minutes) ? 0 : 1,
    minimumFractionDigits: 0,
  }).format(minutes);
}

export function formatUsageMonth(reportingDate: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${reportingDate}T12:00:00Z`));
}

export function formatRenewalDate(range: CalendarMonthRange): string {
  const end = new Date(`${range.to}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(end);
}
