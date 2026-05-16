import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-marine text-white hover:bg-marine-soft active:bg-marine-deep disabled:bg-marine/60 disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-ink border border-slate-300 hover:bg-cream active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed",
  danger:
    "bg-terracotta text-white hover:bg-terracotta/90 active:bg-terracotta/80 disabled:bg-terracotta/60 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-slate-700 hover:bg-cream active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  ),
);

Button.displayName = "Button";
