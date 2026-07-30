"use client";

import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const inputClassName =
  "min-h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/55 focus:ring-3 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-muted/45 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/12";

interface SettingsFieldProps {
  children: ReactNode;
  className?: string;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
  optional?: boolean;
}

export function SettingsField({
  children,
  className,
  description,
  error,
  htmlFor,
  label,
  optional = false,
}: SettingsFieldProps) {
  const errorId = `${htmlFor}-error`;
  const descriptionId = `${htmlFor}-description`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold" htmlFor={htmlFor}>
          {label}
        </label>
        {optional ? (
          <span className="text-[0.7rem] font-medium text-muted-foreground">
            Facoltativo
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          className="text-xs leading-5 text-muted-foreground"
          id={descriptionId}
        >
          {description}
        </p>
      ) : null}
      <div
        aria-describedby={
          [description ? descriptionId : "", error ? errorId : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        {children}
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function SettingsInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function SettingsTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(inputClassName, "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

export function SettingsSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return <select className={cn(inputClassName, className)} {...props} />;
}

interface SettingsToggleProps {
  checked: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingsToggle({
  checked,
  className,
  description,
  disabled = false,
  label,
  onCheckedChange,
}: SettingsToggleProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-4 rounded-xl border bg-muted/20 p-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
          checked
            ? "border-primary bg-primary"
            : "border-input bg-muted-foreground/20",
        )}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={cn(
            "absolute top-0.5 grid size-5 place-items-center rounded-full bg-white text-primary shadow-sm transition-transform",
            checked ? "translate-x-[1.15rem]" : "translate-x-0.5",
          )}
        >
          {checked ? <Check aria-hidden="true" className="size-3" /> : null}
        </span>
      </button>
    </div>
  );
}

interface SettingsSectionHeadingProps {
  description: string;
  eyebrow?: string;
  title: string;
}

export function SettingsSectionHeading({
  description,
  eyebrow,
  title,
}: SettingsSectionHeadingProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-bold tracking-[0.11em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
