import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "./roles";

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
  interface User {
    role: Role;
    status: string;
    restaurantId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: string;
    restaurantId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "borama-food-delivery-dev-secret-key",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.role
        ) {
          throw new Error("Email, password, and role are required");
        }

        const { db } = await import("./db");
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { restaurant: true },
        });

        if (!user) throw new Error("Invalid email or password");

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Invalid email or password");

        if (user.role !== credentials.role) {
          throw new Error(
            `This account is not registered as ${credentials.role}. Select the correct role.`,
          );
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Account suspended. Contact admin.");
        }

        if (user.role === "DRIVER" && user.status === "PENDING") {
          throw new Error("Driver account pending admin approval.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          restaurantId: user.restaurant?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.restaurantId = token.restaurantId;
      }
      return session;
    },
  },
};

export function getDashboardPath(role: Role) {
  const paths: Record<Role, string> = {
    CUSTOMER: "/customer",
    DRIVER: "/driver",
    ADMIN: "/admin",
    RECEPTIONIST: "/receptionist",
  };
  return paths[role];
}
