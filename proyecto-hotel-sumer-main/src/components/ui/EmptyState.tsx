import { type ReactNode } from "react";
import { cn } from "./cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  cta?: ReactNode;
  className?: string;
  // Compact = inline within a widget. Default = page-level.
  size?: "compact" | "default";
};

// Default illustration: a stylized empty box that picks up the heritage marine.
const DefaultIcon = (
  <svg
    className="w-12 h-12 text-marine/30"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0l-2.293-2.293a1 1 0 00-.707-.293H6.586a1 1 0 00-.707.293L4 13m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5"
    />
  </svg>
);

// Page-level empty state. Centered illustration + headline + body + CTA.
// `compact` collapses padding for use inside list widgets.
export const EmptyState = ({
  icon,
  title,
  body,
  cta,
  className,
  size = "default",
}: EmptyStateProps) => (
  <div
    role="status"
    className={cn(
      "flex flex-col items-center justify-center text-center",
      size === "compact" ? "gap-1.5 py-4" : "gap-3 py-10 px-6",
      className,
    )}
  >
    {size === "default" && (icon ?? DefaultIcon)}
    <p
      className={cn(
        "font-serif text-marine",
        size === "compact" ? "text-sm" : "text-lg",
      )}
    >
      {title}
    </p>
    {body && (
      <p
        className={cn(
          "text-slate-500 max-w-sm",
          size === "compact" ? "text-xs" : "text-sm",
        )}
      >
        {body}
      </p>
    )}
    {cta && <div className="mt-1">{cta}</div>}
  </div>
);
