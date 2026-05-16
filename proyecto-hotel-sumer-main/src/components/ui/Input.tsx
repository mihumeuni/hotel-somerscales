import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";
import { cn } from "./cn";

export const fieldBaseClasses =
  "block w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-base text-ink placeholder:text-slate-400 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine focus-visible:border-marine " +
  "disabled:bg-slate-100 disabled:cursor-not-allowed";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helper, error, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            fieldBaseClasses,
            error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
            className,
          )}
          {...rest}
        />
        {helper && !error && (
          <p id={helperId} className="text-xs text-slate-500">
            {helper}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
