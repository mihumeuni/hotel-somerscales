import { type ReactNode } from "react";
import { cn } from "../ui/cn";

type Variant = "marine" | "surface";

type KpiTileProps = {
  variant?: Variant;
  eyebrow: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

// Generic two-zone tile used by the dashboard hero: eyebrow + optional
// right-aligned aside on top, free-form body below. Marine variant is the
// dark hero; surface is the soft companion card.
export const KpiTile = ({ variant = "surface", eyebrow, aside, children, className }: KpiTileProps) => {
  const isMarine = variant === "marine";
  return (
    <div
      className={cn(
        "rounded-xl p-5 shadow-sm",
        isMarine
          ? "bg-[var(--color-marine)] text-[var(--color-cream)] shadow-md"
          : "bg-[var(--color-surface)] border border-slate-200 text-[var(--color-ink)]",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cn(
            "text-[10px] uppercase tracking-widest font-semibold",
            isMarine ? "text-[var(--color-cream)]/70" : "text-slate-500",
          )}
        >
          {eyebrow}
        </p>
        {aside && (
          <div
            className={cn(
              "text-xs font-semibold",
              isMarine ? "text-[var(--color-cream)]/70" : "text-slate-500",
            )}
          >
            {aside}
          </div>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
};
