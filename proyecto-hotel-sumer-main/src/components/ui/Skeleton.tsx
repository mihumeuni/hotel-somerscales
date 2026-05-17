import { cn } from "./cn";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  as?: "div" | "span" | "li";
};

const roundedClass: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

// Slate-100 pulsing block. Caller controls width/height via className.
export const Skeleton = ({
  className,
  rounded = "md",
  as: Tag = "div",
}: SkeletonProps) => (
  <Tag
    aria-hidden="true"
    className={cn(
      "bg-slate-100 animate-pulse",
      roundedClass[rounded],
      className,
    )}
  />
);

// Pre-baked row used by lists/tables. n controls how many stripes appear.
export const SkeletonStack = ({
  rows = 3,
  rowClassName,
}: {
  rows?: number;
  rowClassName?: string;
}) => (
  <div className="flex flex-col gap-2" aria-live="polite" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className={cn("h-4 w-full", rowClassName)} />
    ))}
  </div>
);
