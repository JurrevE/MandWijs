export type AppRole = "user" | "admin";

export function canAccessUserResource(
  currentUser: { id: string; role: AppRole } | null,
  resourceOwnerId: string,
) {
  return Boolean(currentUser && (currentUser.id === resourceOwnerId || currentUser.role === "admin"));
}

export function canManageGlobalData(currentUser: { id: string; role: AppRole } | null) {
  return currentUser?.role === "admin";
}
