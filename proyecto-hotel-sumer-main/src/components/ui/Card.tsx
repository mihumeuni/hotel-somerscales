import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
};

export const Card = ({ title, description, children, className, ...rest }: CardProps) => (
  <div
    className={cn(
      "rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-6",
      className,
    )}
    {...rest}
  >
    {title && <h2 className="text-lg font-semibold text-slate-900 md:text-xl">{title}</h2>}
    {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    {children && <div className={cn((title || description) && "mt-4")}>{children}</div>}
  </div>
);
