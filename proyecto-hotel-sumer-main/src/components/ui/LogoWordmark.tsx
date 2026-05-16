import { cn } from "./cn";
import { LogoMark } from "./LogoMark";

type LogoWordmarkProps = {
  subtitle?: string;
  withMark?: boolean;
  markSize?: number;
  className?: string;
};

export const LogoWordmark = ({
  subtitle,
  withMark = true,
  markSize = 36,
  className,
}: LogoWordmarkProps) => (
  <div className={cn("flex items-baseline gap-2", className)}>
    {withMark && <LogoMark size={markSize} />}
    <div className="flex flex-col">
      <span className="font-serif text-marine text-xl leading-none tracking-wide">
        Somerscales
      </span>
      {subtitle && (
        <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-marine/60">
          {subtitle}
        </span>
      )}
    </div>
  </div>
);
