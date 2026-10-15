import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CircleNotch } from "@phosphor-icons/react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 active:scale-[0.98]";

    const variantClasses = {
      primary:
        "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm hover:shadow active:bg-[var(--primary-hover)]",
      secondary:
        "bg-[var(--surface-elevated)] text-[var(--foreground)] hover:bg-[var(--surface-border)]/50 border border-[var(--surface-border)]",
      outline:
        "bg-transparent text-[var(--foreground)] border border-[var(--surface-border)] hover:bg-[var(--surface-elevated)] hover:border-gray-400 dark:hover:border-gray-600",
      ghost:
        "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)]",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800",
      subtle:
        "bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white",
    };

    const sizeClasses = {
      xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 px-4 text-sm rounded-xl gap-2",
      lg: "h-11 px-5 text-base rounded-xl gap-2.5",
      icon: "h-9 w-9 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading && <CircleNotch className="animate-spin text-current text-sm shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
