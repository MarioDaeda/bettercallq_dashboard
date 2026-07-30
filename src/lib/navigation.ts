export const appNavigation = [
  {
    label: "Panoramica",
    shortLabel: "Panoramica",
    href: "/",
    icon: "overview",
  },
  {
    label: "Da gestire",
    shortLabel: "Da gestire",
    href: "/da-gestire",
    icon: "interventions",
  },
  {
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    href: "/whatsapp",
    icon: "whatsapp",
  },
  {
    label: "Chiamate",
    shortLabel: "Chiamate",
    href: "/chiamate",
    icon: "calls",
  },
  {
    label: "Impostazioni IA",
    shortLabel: "Impostazioni",
    href: "/impostazioni-ia",
    icon: "settings",
  },
  {
    label: "QR e canali",
    shortLabel: "QR e canali",
    href: "/qr-e-canali",
    icon: "channels",
  },
  {
    label: "Monitoraggio",
    shortLabel: "Monitoraggio",
    href: "/monitoraggio",
    icon: "monitoring",
  },
] as const;

export type NavigationIcon = (typeof appNavigation)[number]["icon"];

export const getNavigationItem = (pathname: string) =>
  appNavigation.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  ) ?? appNavigation[0];
