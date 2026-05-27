import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateOrderNumber() {
  return `BF-${Date.now().toString(36).toUpperCase()}`;
}

export const SERVICE_TAX_RATE = 0.05;
export const DELIVERY_FEE = 2.5;
export const DRIVER_COMMISSION_RATE = 0.15;
export const PLATFORM_FEE_RATE = 0.1;

export function calculateOrderTotals(subtotal: number) {
  const serviceTax = subtotal * SERVICE_TAX_RATE;
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + serviceTax + deliveryFee;
  return { subtotal, serviceTax, deliveryFee, total };
}

export const BORAMA_CENTER = { lat: 9.934, lng: 43.181 };

export const CUISINES = [
  "Somali",
  "Italian",
  "Indian",
  "Fast Food",
  "Seafood",
  "Vegetarian",
  "Bakery",
  "Cafe",
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  COOKING: "Cooking",
  READY: "Ready for Pickup",
  PICKED_UP: "Picked Up",
  DELIVERING: "On the Way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
