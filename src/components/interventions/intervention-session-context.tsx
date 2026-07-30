"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Intervention } from "@/lib/domain";
import { formatInteger } from "@/lib/overview/formatters";

interface InterventionSessionValue {
  activeInterventions: Intervention[];
  setActiveInterventions: (interventions: Intervention[]) => void;
}

const InterventionSessionContext =
  createContext<InterventionSessionValue | null>(null);

export function InterventionSessionProvider({
  children,
  initialInterventions,
}: {
  children: ReactNode;
  initialInterventions: Intervention[];
}) {
  const [activeInterventions, setActiveInterventions] =
    useState(initialInterventions);
  const value = useMemo(
    () => ({ activeInterventions, setActiveInterventions }),
    [activeInterventions],
  );

  return (
    <InterventionSessionContext value={value}>
      {children}
    </InterventionSessionContext>
  );
}

export function useInterventionAttentionCount(fallback: number) {
  return (
    useContext(InterventionSessionContext)?.activeInterventions.length ??
    fallback
  );
}

export function useActiveInterventions(fallback: Intervention[]) {
  return (
    useContext(InterventionSessionContext)?.activeInterventions ?? fallback
  );
}

export function useSetActiveInterventions() {
  return useContext(InterventionSessionContext)?.setActiveInterventions;
}

export function InterventionAttentionValue({
  fallback,
}: {
  fallback: number;
}) {
  return formatInteger(useInterventionAttentionCount(fallback));
}
