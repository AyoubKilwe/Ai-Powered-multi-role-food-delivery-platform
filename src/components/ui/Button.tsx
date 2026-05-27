import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25",
      secondary: "bg-stone-800 text-white hover:bg-stone-900",
      outline: "border-2 border-brand-600 text-brand-700 hover:bg-brand-50",
      ghost: "text-stone-600 hover:bg-stone-100",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm font-semibold",
      lg: "px-8 py-3.5 text-base font-semibold",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
