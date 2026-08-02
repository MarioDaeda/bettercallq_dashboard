export const appRoles = ["admin", "salon_owner"] as const;

export type AppRole = (typeof appRoles)[number];

export const permissions = [
  "overview:view",
  "interventions:view",
  "interventions:manage",
  "calls:view",
  "transcripts:view",
  "whatsapp:view",
  "whatsapp:manage",
  "salon-settings:view",
  "salon-settings:edit",
  "ai-settings:manage",
  "channels:manage",
  "monitoring:view",
  "diagnostics:view",
  "users:manage",
] as const;

export type Permission = (typeof permissions)[number];

const salonOwnerPermissions = [
  "overview:view",
  "calls:view",
  "whatsapp:view",
] as const satisfies readonly Permission[];

export const rolePermissions = {
  admin: permissions,
  salon_owner: salonOwnerPermissions,
} as const satisfies Record<AppRole, readonly Permission[]>;

export function getPermissionsForRole(
  role: AppRole,
): readonly Permission[] {
  return rolePermissions[role];
}

export function hasPermission(
  role: AppRole,
  permission: Permission,
): boolean {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}

export function hasEveryPermission(
  role: AppRole,
  requiredPermissions: readonly Permission[],
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(role, permission),
  );
}
