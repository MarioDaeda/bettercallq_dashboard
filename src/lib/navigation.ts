import {
  hasPermission,
  type AppRole,
  type Permission,
} from "@/lib/auth/permissions";

export type NavigationIcon =
  | "overview"
  | "interventions"
  | "whatsapp"
  | "calls"
  | "settings"
  | "salon"
  | "channels"
  | "monitoring";

export interface NavigationItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: NavigationIcon;
  permission: Permission;
}

const adminNavigation = [
  {
    label: "Panoramica",
    shortLabel: "Panoramica",
    href: "/",
    icon: "overview",
    permission: "overview:view",
  },
  {
    label: "Da gestire",
    shortLabel: "Da gestire",
    href: "/da-gestire",
    icon: "interventions",
    permission: "interventions:view",
  },
  {
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    href: "/whatsapp",
    icon: "whatsapp",
    permission: "whatsapp:manage",
  },
  {
    label: "Chiamate",
    shortLabel: "Chiamate",
    href: "/chiamate",
    icon: "calls",
    permission: "calls:view",
  },
  {
    label: "Impostazioni IA",
    shortLabel: "Impostazioni",
    href: "/impostazioni-ia",
    icon: "settings",
    permission: "ai-settings:manage",
  },
  {
    label: "QR e canali",
    shortLabel: "QR e canali",
    href: "/qr-e-canali",
    icon: "channels",
    permission: "channels:manage",
  },
  {
    label: "Monitoraggio",
    shortLabel: "Monitoraggio",
    href: "/monitoraggio",
    icon: "monitoring",
    permission: "monitoring:view",
  },
] as const satisfies readonly NavigationItem[];

const salonOwnerNavigation = [
  {
    label: "Panoramica",
    shortLabel: "Panoramica",
    href: "/",
    icon: "overview",
    permission: "overview:view",
  },
  {
    label: "Chiamate",
    shortLabel: "Chiamate",
    href: "/chiamate",
    icon: "calls",
    permission: "calls:view",
  },
  {
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    href: "/whatsapp",
    icon: "whatsapp",
    permission: "whatsapp:view",
  },
] as const satisfies readonly NavigationItem[];

export const navigationByRole = {
  admin: adminNavigation,
  salon_owner: salonOwnerNavigation,
} as const satisfies Record<AppRole, readonly NavigationItem[]>;

export const appNavigation = navigationByRole.admin;

export function getNavigationForRole(
  role: AppRole,
): readonly NavigationItem[] {
  return navigationByRole[role].filter((item) =>
    hasPermission(role, item.permission),
  );
}

export const getNavigationItem = (
  pathname: string,
  role: AppRole = "admin",
) => {
  const navigation = getNavigationForRole(role);

  return (
    navigation.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? navigation[0]
  );
};
