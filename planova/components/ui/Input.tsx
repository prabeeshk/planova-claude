import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full h-9 px-3 rounded-xl border bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-transparent",
            error ? "border-red-500 focus-visible:ring-red-500" : "border-[var(--surface-border)]",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-[11px] text-[var(--muted)]">{hint}</p>}
        {error && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
