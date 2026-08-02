import { CalendarCheck2, MessageCircle, PhoneCall } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MonthlyResultsCardProps {
  bookings: number;
  calls: number;
  conversations: number;
}

const numberFormatter = new Intl.NumberFormat("it-IT");

export function MonthlyResultsCard({
  bookings,
  calls,
  conversations,
}: MonthlyResultsCardProps) {
  const results = [
    {
      icon: PhoneCall,
      label: "Chiamate ricevute",
      value: calls,
    },
    {
      icon: CalendarCheck2,
      label: "Appuntamenti gestiti",
      value: bookings,
    },
    {
      icon: MessageCircle,
      label: "Conversazioni WhatsApp",
      value: conversations,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risultati del mese</CardTitle>
        <CardDescription>
          I tre dati principali dell’attività gestita da BetterCallQ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result) => {
          const Icon = result.icon;

          return (
            <div
              className="flex items-center justify-between gap-4 rounded-xl border bg-muted/25 p-3.5"
              key={result.label}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                <span className="text-sm font-medium">{result.label}</span>
              </div>
              <span className="text-lg font-bold">
                {numberFormatter.format(result.value)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
