import { type ReactNode } from "react";

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-slate-500 italic">{children}</p>
);
