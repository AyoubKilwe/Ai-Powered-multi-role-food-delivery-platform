import type { Role } from "@/lib/roles";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      status: string;
      restaurantId?: string;
    };
  }
}
