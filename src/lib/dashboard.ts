import type { Role } from "./roles";

export function getDashboardPath(role: Role) {
  const paths: Record<Role, string> = {
    CUSTOMER: "/customer",
    DRIVER: "/driver",
    ADMIN: "/admin",
    RECEPTIONIST: "/receptionist",
  };
  return paths[role];
}
