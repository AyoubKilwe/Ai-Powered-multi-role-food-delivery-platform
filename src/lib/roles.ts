export const ROLES = ["CUSTOMER", "DRIVER", "ADMIN", "RECEPTIONIST"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "COOKING",
  "READY",
  "PICKED_UP",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
