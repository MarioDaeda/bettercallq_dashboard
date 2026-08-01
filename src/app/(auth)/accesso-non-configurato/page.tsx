import type { Metadata } from "next";
import { UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Accesso non configurato",
};

export default function UnconfiguredAccessPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-2 grid size-10 place-items-center rounded-xl bg-warning/12 text-warning-foreground">
          <UserRoundX aria-hidden="true" className="size-5" />
        </div>
        <CardTitle>Account non ancora abilitato</CardTitle>
        <CardDescription>
          L’identità è valida, ma mancano il ruolo BetterCallQ o il collegamento
          al salone. Un amministratore deve completare i metadati dell’account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signOutAction}>
          <Button className="w-full" type="submit" variant="outline">
            Esci
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
