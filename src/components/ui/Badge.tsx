import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  COOKING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERING: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  CANCELLED: "bg-stone-100 text-stone-600",
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
};

export function Badge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const safe = typeof status === "string" && status ? status : "UNKNOWN";
  const label = safe.replace(/_/g, " ").toLowerCase();
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[safe] || "bg-stone-100 text-stone-700",
        className,
      )}
    >
      {display}
    </span>
  );
}
