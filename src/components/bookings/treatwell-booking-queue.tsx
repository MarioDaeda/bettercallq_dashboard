import {
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TreatwellBookingRow } from "@/lib/persistence/database-contracts";

interface TreatwellBookingQueueProps {
  bookings: TreatwellBookingRow[];
  completeAction: (formData: FormData) => Promise<void>;
}

const labels = {
  cancellation_required: {
    action: "Segna cancellazione riportata",
    description: "Cancella l'appuntamento anche su Treatwell.",
    Icon: CalendarX2,
    label: "Cancellazione da riportare",
  },
  to_sync: {
    action: "Segna come inserito",
    description: "Inserisci manualmente questa prenotazione su Treatwell.",
    Icon: CalendarCheck2,
    label: "Nuova prenotazione",
  },
  update_required: {
    action: "Segna modifica riportata",
    description: "Aggiorna su Treatwell i dati modificati.",
    Icon: CalendarClock,
    label: "Modifica da riportare",
  },
} as const;

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

export function TreatwellBookingQueue({
  bookings,
  completeAction,
}: TreatwellBookingQueueProps) {
  return (
    <section aria-labelledby="treatwell-queue-title" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Pilot slot riservati
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            id="treatwell-queue-title"
          >
            Operazioni da riportare su Treatwell
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Questa è la coda reale generata dalle prenotazioni BetterCallQ. Gli
            appuntamenti pending o falliti non vengono mostrati.
          </p>
        </div>
        <div className="rounded-full border bg-card px-3 py-1.5 text-sm font-semibold">
          {bookings.length} {bookings.length === 1 ? "operazione" : "operazioni"}
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <div className="grid size-10 place-items-center rounded-xl bg-success/12 text-success">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Coda aggiornata</p>
              <p className="text-sm text-muted-foreground">
                Non ci sono operazioni manuali da riportare su Treatwell.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {bookings.map((booking) => {
            const item = labels[booking.treatwell_status];
            const Icon = item.Icon;

            return (
              <Card key={booking.id}>
                <CardHeader className="flex-row items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle>{booking.customer_name}</CardTitle>
                    <CardDescription>{item.label}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Servizio</dt>
                      <dd className="font-medium">{booking.service_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Quando</dt>
                      <dd className="font-medium">
                        {dateFormatter.format(new Date(booking.starts_at))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Durata</dt>
                      <dd>{booking.duration_minutes} minuti</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Telefono</dt>
                      <dd>{booking.customer_phone ?? "Non disponibile"}</dd>
                    </div>
                  </dl>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                  <form action={completeAction}>
                    <input name="bookingId" type="hidden" value={booking.id} />
                    <Button type="submit">
                      <Check aria-hidden="true" />
                      {item.action}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
