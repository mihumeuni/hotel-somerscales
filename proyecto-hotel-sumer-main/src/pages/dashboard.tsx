import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Card } from "../components/ui";
import { api } from "../lib/apiClient";

type OccupancyPoint = { month: string; nights: number };
type TopGuest = {
  huespedId: number;
  nombreCompleto: string;
  visitCount: number;
  lastVisit: string | null;
};
type CategoryBreakdown = {
  code: string;
  positive: number;
  neutral: number;
  negative: number;
};
type SentimentSummary = {
  counts: Record<string, number>;
  byCategory: CategoryBreakdown[];
};

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: "#16a34a",
  NEUTRAL: "#94a3b8",
  NEGATIVE: "#dc2626",
};

const CATEGORY_LABELS_ES: Record<string, string> = {
  cleanliness: "Limpieza",
  service: "Servicio",
  food: "Comida",
  location: "Ubicación",
  value: "Valor",
  comfort: "Comodidad",
  amenities: "Amenidades",
  other: "Otro",
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function presetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState(() => presetRange(365));

  const [occupancy, setOccupancy] = useState<OccupancyPoint[] | null>(null);
  const [occError, setOccError] = useState<string | null>(null);

  const [topGuests, setTopGuests] = useState<TopGuest[] | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOccupancy(null);
    setTopGuests(null);
    setSentiment(null);
    setOccError(null);
    setTopError(null);
    setSentError(null);

    const qs = `?from=${range.from}&to=${range.to}`;

    api
      .get<OccupancyPoint[]>(`/api/dashboard/occupancy${qs}`)
      .then((data) => !cancelled && setOccupancy(data))
      .catch((err: unknown) => !cancelled && setOccError(String((err as Error)?.message ?? err)));

    api
      .get<TopGuest[]>(`/api/dashboard/top-guests?limit=10&from=${range.from}&to=${range.to}`)
      .then((data) => !cancelled && setTopGuests(data))
      .catch((err: unknown) => !cancelled && setTopError(String((err as Error)?.message ?? err)));

    api
      .get<SentimentSummary>(`/api/dashboard/sentiment${qs}`)
      .then((data) => !cancelled && setSentiment(data))
      .catch((err: unknown) => !cancelled && setSentError(String((err as Error)?.message ?? err)));

    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const pieData = useMemo(() => {
    if (!sentiment) return [];
    return Object.entries(sentiment.counts).map(([name, value]) => ({ name, value }));
  }, [sentiment]);

  const categoryData = useMemo(() => {
    if (!sentiment) return [];
    return sentiment.byCategory.map((c) => ({
      ...c,
      label: CATEGORY_LABELS_ES[c.code] ?? c.code,
    }));
  }, [sentiment]);

  const sentimentEmpty =
    sentiment !== null && Object.values(sentiment.counts).every((v) => v === 0);

  return (
    <AppShell
      title="Dashboard"
      description="Indicadores de ocupación, fidelidad y reputación"
    >
      <Card title="Rango de fechas" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-700">Desde</span>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-700">Hasta</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <PresetButton onClick={() => setRange(presetRange(30))}>30 días</PresetButton>
            <PresetButton onClick={() => setRange(presetRange(90))}>90 días</PresetButton>
            <PresetButton onClick={() => setRange(presetRange(365))}>12 meses</PresetButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Ocupación (noches/mes)">
          <ChartBox
            loading={occupancy === null && occError === null}
            error={occError}
            empty={occupancy !== null && occupancy.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={occupancy ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="nights" stroke="#0ea5e9" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Top huéspedes por visitas">
          <ChartBox
            loading={topGuests === null && topError === null}
            error={topError}
            empty={topGuests !== null && topGuests.length === 0}
          >
            <ol className="divide-y divide-slate-200">
              {topGuests?.map((g, i) => (
                <li key={g.huespedId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/huespedes/${g.huespedId}`)}
                    className="grid w-full grid-cols-[2rem_1fr_max-content] items-center gap-3 px-2 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-slate-500">#{i + 1}</span>
                    <span className="truncate text-sm font-medium text-slate-900">
                      {g.nombreCompleto}
                    </span>
                    <span className="text-right text-sm text-slate-700">
                      <div>
                        {g.visitCount} estad{g.visitCount === 1 ? "ía" : "ías"}
                      </div>
                      {g.lastVisit && (
                        <div className="text-xs text-slate-400">
                          Última: {g.lastVisit.slice(0, 10)}
                        </div>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </ChartBox>
        </Card>

        <Card title="Sentimiento de reseñas">
          <ChartBox
            loading={sentiment === null && sentError === null}
            error={sentError}
            empty={sentimentEmpty}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={(entry: { value?: number }) => `${entry.value ?? 0}`}
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={SENTIMENT_COLORS[d.name] ?? "#cbd5e1"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {categoryData.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <h3 className="mb-2 text-sm font-medium text-slate-700">Por categoría</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="positive" stackId="s" fill={SENTIMENT_COLORS.POSITIVE} name="Positivo" />
                    <Bar dataKey="neutral" stackId="s" fill={SENTIMENT_COLORS.NEUTRAL} name="Neutro" />
                    <Bar dataKey="negative" stackId="s" fill={SENTIMENT_COLORS.NEGATIVE} name="Negativo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartBox>
        </Card>
      </div>
    </AppShell>
  );
};

type PresetButtonProps = {
  onClick: () => void;
  children: ReactNode;
};

const PresetButton = ({ onClick, children }: PresetButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
  >
    {children}
  </button>
);

type ChartBoxProps = {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  children: ReactNode;
};

const ChartBox = ({ loading, error, empty, children }: ChartBoxProps) => {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">Error: {error}</p>;
  }
  if (empty) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Sin datos en el rango seleccionado.
      </p>
    );
  }
  return <>{children}</>;
};

export default Dashboard;
