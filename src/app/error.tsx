"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorState
      description="La dashboard non ha potuto completare il caricamento. Nessun dato è stato modificato."
      onRetry={props.unstable_retry}
      title="Impossibile caricare la sezione"
    />
  );
}
