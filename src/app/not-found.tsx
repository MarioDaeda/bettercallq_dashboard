import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <EmptyState
          description="La pagina richiesta non appartiene alle sette sezioni della dashboard BetterCallQ."
          eyebrow="Errore 404"
          title="Questa pagina non esiste"
        >
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft aria-hidden="true" data-icon="inline-start" />
              Torna alla Panoramica
            </Link>
          </Button>
        </EmptyState>
      </CardContent>
    </Card>
  );
}
