import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white p-6 shadow-sm", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-stone-900">{title}</h3>}
          {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
