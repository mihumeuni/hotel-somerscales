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
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-500/60 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-600/60 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  ),
);

Button.displayName = "Button";
