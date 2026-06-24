import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui";
import { api } from "../lib/apiClient";
import { lastSuccessfulSync, type SyncRun } from "../types/cloudbedsSync";
import {
  AvailabilityTile,
  CategoryChips,
  GuestStrip,
  KpiTile,
  LeaderboardCard,
  NormalizedComments,
  RoomCalendarGrid,
  SentimentBars,
  type AvailabilityDTO,
  type CategoryCountDTO,
  type GuestStripDTO,
  type NormalizedReviewDTO,
  type ReservaCalendarDTO,
  type SentimentSummaryDTO,
  type TopGuestDTO,
} from "../components/dashboard";

// Reviews accrue over months/years; the dashboard shows the full review
// history (the product's centralized historical record), so older reviews
// don't silently drop off the sentiment KPIs the way a 30-day window did.
const REVIEW_HISTORY_FROM = "2000-01-01";
const CALENDAR_WINDOW_DAYS = 7;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastNDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

// Forward window for the room-calendar widget, padded one day each side so the
// client-side [now, now+days] filter is fully covered despite UTC/local skew.
function nextNDays(days: number): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 1);
  const to = new Date(today);
  to.setDate(to.getDate() + days + 1);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [availability, setAvailability] = useState<AvailabilityDTO | null>(null);
  const [topVisits, setTopVisits] = useState<TopGuestDTO[]>([]);
  const [topSpend, setTopSpend] = useState<TopGuestDTO[]>([]);
  const [current, setCurrent] = useState<GuestStripDTO[]>([]);
  const [recent, setRecent] = useState<GuestStripDTO[]>([]);
  const [sentiment, setSentiment] = useState<SentimentSummaryDTO | null>(null);
  const [categories, setCategories] = useState<CategoryCountDTO[]>([]);
  const [normalized, setNormalized] = useState<NormalizedReviewDTO[]>([]);
  const [reservas, setReservas] = useState<ReservaCalendarDTO[]>([]);
  const [lastSync, setLastSync] = useState<SyncRun | null>(null);

  const [loading, setLoading] = useState({
    availability: true,
    visits: true,
    spend: true,
    current: true,
    recent: true,
    sentiment: true,
    categories: true,
    normalized: true,
    reservas: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const window = { from: REVIEW_HISTORY_FROM, to: toIsoDate(new Date()) };
      const visitsWindow = lastNDays(365);
      const calWindow = nextNDays(CALENDAR_WINDOW_DAYS);

      const tasks: Array<Promise<unknown>> = [
        api
          .get<AvailabilityDTO>("/api/dashboard/availability")
          .then((d) => !cancelled && (setAvailability(d), markDone("availability"))),
        api
          .get<TopGuestDTO[]>(`/api/dashboard/top-guests?from=${visitsWindow.from}&to=${visitsWindow.to}&limit=5&metric=visits`)
          .then((d) => !cancelled && (setTopVisits(d), markDone("visits"))),
        api
          .get<TopGuestDTO[]>(`/api/dashboard/top-guests?from=${visitsWindow.from}&to=${visitsWindow.to}&limit=5&metric=spend`)
          .then((d) => !cancelled && (setTopSpend(d), markDone("spend"))),
        api
          .get<GuestStripDTO[]>("/api/dashboard/current-guests")
          .then((d) => !cancelled && (setCurrent(d), markDone("current"))),
        api
          .get<GuestStripDTO[]>("/api/dashboard/recent-guests?limit=10")
          .then((d) => !cancelled && (setRecent(d), markDone("recent"))),
        api
          .get<SentimentSummaryDTO>(`/api/dashboard/sentiment?from=${window.from}&to=${window.to}`)
          .then((d) => !cancelled && (setSentiment(d), markDone("sentiment"))),
        api
          .get<CategoryCountDTO[]>(`/api/dashboard/categories?from=${window.from}&to=${window.to}`)
          .then((d) => !cancelled && (setCategories(d), markDone("categories"))),
        api
          .get<NormalizedReviewDTO[]>(`/api/dashboard/normalized-reviews?from=${window.from}&to=${window.to}&limit=12`)
          .then((d) => !cancelled && (setNormalized(d), markDone("normalized"))),
        api
          .get<ReservaCalendarDTO[]>(
            `/api/reservas/calendario?from=${calWindow.from}&to=${calWindow.to}`
          )
          .then((d) => !cancelled && (setReservas(d), markDone("reservas"))),
      ];

      const results = await Promise.allSettled(tasks);
      if (!cancelled) {
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length === results.length) {
          setError("No se pudo cargar el dashboard. Revisa la conexión con la API.");
        }
      }
    }

    function markDone(key: keyof typeof loading) {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }

    load();
    lastSuccessfulSync().then((run) => !cancelled && setLastSync(run));
    return () => {
      cancelled = true;
    };
  }, []);

  const lastSyncLabel = lastSync
    ? new Date(lastSync.startedAt).toLocaleString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  // task031: totalReviews is the distinct labelled count (multi-label means
  // sum of bucket counts ≥ total). Surface a few headline buckets for the KPI
  // tile by code so a renamed label still appears under the right number.
  const reviewCount = sentiment?.totalReviews ?? 0;
  const bucketCount = (code: string) =>
    sentiment?.buckets.find((b) => b.code === code)?.count ?? 0;
  const negativeCount = bucketCount("negative");
  const positiveCount = bucketCount("positive");
  const complaintCount = bucketCount("complaint");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Resumen operativo de Hotel Somerscales — disponibilidad, huéspedes y reseñas."
      />

      {error && (
        <div className="rounded-lg border border-[var(--color-terracotta)]/40 bg-[var(--color-terracotta)]/5 text-[var(--color-terracotta)] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPI hero strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AvailabilityTile data={availability} loading={loading.availability} />
        <KpiTile eyebrow="Reseñas" aside={loading.sentiment ? null : `${reviewCount} en total`}>
          {loading.sentiment ? (
            <div className="h-9 w-16 bg-slate-100 rounded animate-pulse mt-1" />
          ) : (
            <>
              <p className="text-3xl font-serif font-bold text-[var(--color-marine)]">{reviewCount}</p>
              <p className="text-xs text-slate-500 mt-1">
                <span className="text-[var(--color-terracotta)] font-semibold">{negativeCount} negativas</span>
                {" · "}
                <span>{positiveCount} positivas</span>
                {" · "}
                <span>{complaintCount} reclamos</span>
              </p>
            </>
          )}
        </KpiTile>
      </section>

      {/* Widget grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LeaderboardCard
          title="Huéspedes más frecuentes"
          eyebrow="Top 5"
          rows={topVisits}
          loading={loading.visits}
          format="visits"
        />
        <LeaderboardCard
          title="Mayor gasto"
          eyebrow="Año móvil"
          rows={topSpend}
          loading={loading.spend}
          format="spend"
        />
        <GuestStrip
          title="Huéspedes actuales"
          eyebrow={current.length > 0 ? `${current.length} reservas` : undefined}
          rows={current}
          loading={loading.current}
          flavour="current"
        />
        <GuestStrip
          title="Huéspedes recientes"
          eyebrow="Últimos 10"
          rows={recent}
          loading={loading.recent}
          flavour="recent"
        />
        <SentimentBars data={sentiment} loading={loading.sentiment} />
        <CategoryChips rows={categories} loading={loading.categories} />
        <NormalizedComments rows={normalized} loading={loading.normalized} />
        <RoomCalendarGrid
          reservas={reservas}
          windowDays={CALENDAR_WINDOW_DAYS}
          compact
          loading={loading.reservas}
          onSeeAll={() => navigate("/calendario")}
        />
        {lastSyncLabel && (
          <p className="text-xs text-slate-500 text-right -mt-2">
            Datos al {lastSyncLabel} · sincronización Cloudbeds
          </p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
