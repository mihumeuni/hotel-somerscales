export const SkeletonRow = () => (
  <li className="flex items-center gap-3 p-1 -mx-1">
    <span className="w-5 h-4 bg-slate-100 rounded animate-pulse" />
    <span className="w-9 h-9 bg-slate-100 rounded-full animate-pulse" />
    <span className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
    <span className="w-14 h-4 bg-slate-100 rounded animate-pulse" />
  </li>
);
