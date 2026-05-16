import { KpiTile } from "./KpiTile";
import { type AvailabilityDTO } from "./types";

type Props = {
  data: AvailabilityDTO | null;
  loading?: boolean;
};

// Three absolute mini-stats inside one marine tile — matches the locked
// wireframe `view-dashboard` hero. Renders skeleton bars when `loading`.
export const AvailabilityTile = ({ data, loading }: Props) => {
  const total = data?.totalRooms ?? 0;
  return (
    <KpiTile
      variant="marine"
      eyebrow="Disponibilidad"
      aside={total > 0 ? `${total} habitaciones totales` : null}
      className="sm:col-span-2"
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Cell title="Hoy" subtitle="libres ahora" value={data?.today} total={total} loading={loading} />
        <Cell title="Esta semana" subtitle="máx libres / día" value={data?.week.maxFree} total={total} loading={loading} />
        <Cell title="Este mes" subtitle="máx libres / día" value={data?.month.maxFree} total={total} loading={loading} />
      </div>
    </KpiTile>
  );
};

const Cell = ({
  title,
  subtitle,
  value,
  total,
  loading,
}: {
  title: string;
  subtitle: string;
  value: number | undefined;
  total: number;
  loading?: boolean;
}) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-[var(--color-cream)]/60">{title}</p>
    {loading || value === undefined ? (
      <div className="mt-2 h-7 w-16 rounded bg-[var(--color-cream)]/15 animate-pulse" />
    ) : (
      <p className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-[var(--color-cream)]">
        {value}
        {total > 0 && <span className="text-base text-[var(--color-cream)]/50"> / {total}</span>}
      </p>
    )}
    <p className="text-[10px] text-[var(--color-cream)]/60 mt-0.5">{subtitle}</p>
  </div>
);
