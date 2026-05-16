import { type CSSProperties } from "react";
import { cn } from "./cn";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export const LogoMark = ({ size = 40, className }: LogoMarkProps) => {
  const style: CSSProperties = { width: size, height: size };
  const fontSize = Math.round(size * 0.5);
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        "shrink-0 rounded-full bg-marine flex items-center justify-center",
        className,
      )}
    >
      <span
        className="font-serif text-white leading-none"
        style={{ fontSize, marginTop: -Math.round(size * 0.04) }}
      >
        S
      </span>
    </div>
  );
};
