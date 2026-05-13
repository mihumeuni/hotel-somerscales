import { type ReactNode } from "react";
import { cn } from "./cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: ReactNode;
  className?: string;
};

const getCellValue = <T,>(row: T, column: Column<T>): ReactNode => {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

export const Table = <T,>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Sin resultados",
  className,
}: TableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={rowKey(row, index)}
            className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
          >
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5">
              {columns.map((column) => (
                <div key={column.key} className="contents">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {column.header}
                  </dt>
                  <dd className="text-sm text-slate-900 break-words">
                    {getCellValue(row, column)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop: real table */}
      <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-4 py-2", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-2 text-slate-900", column.className)}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
