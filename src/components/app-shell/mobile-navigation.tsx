"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { Brand } from "./brand";
import { NavigationList } from "./navigation-list";

export function MobileNavigation({
  attentionCount,
}: {
  attentionCount: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  const close = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  };

  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <>
      <Button
        aria-label="Apri menu"
        className="size-10 rounded-xl lg:hidden"
        onClick={() => dialogRef.current?.showModal()}
        size="icon"
        variant="ghost"
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>

      <dialog
        aria-label="Menu principale"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] max-w-none border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-2xl focus:outline-none"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            close();
          }
        }}
        ref={dialogRef}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between gap-4 px-2 py-1">
            <Brand />
            <Button
              aria-label="Chiudi menu"
              className="size-10 rounded-xl"
              onClick={close}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className="mb-2 px-3 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              Il tuo salone
            </p>
            <NavigationList
              attentionCount={attentionCount}
              onNavigate={close}
            />
          </div>

          <div className="mt-4 shrink-0 rounded-2xl border bg-muted/50 p-4">
            <p className="text-sm font-semibold">Modalità dimostrativa</p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Le integrazioni restano simulate fino alle rispettive task.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
