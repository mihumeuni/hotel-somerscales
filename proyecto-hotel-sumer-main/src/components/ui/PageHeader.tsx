import { type ReactNode } from "react";
import { cn } from "./cn";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) => (
  <header
    className={cn(
      "mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-4",
      className,
    )}
  >
    <div className="min-w-0">
      <h1 className="font-serif text-marine text-2xl md:text-3xl tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);
