import { useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/ui";
import { CategoriesTab } from "./CategoriesTab";
import { SentimentTaxonomyTab } from "./SentimentTaxonomyTab";
import { QuickpicksTab } from "./QuickpicksTab";
import { DefaultsTab } from "./DefaultsTab";

type TabKey = "categories" | "taxonomy" | "quickpicks" | "defaults";

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "categories", label: "Categorías" },
  { key: "taxonomy",   label: "Taxonomía de sentimiento" },
  { key: "quickpicks", label: "Quick-picks de fichas" },
  { key: "defaults",   label: "Por defecto" },
];

const isTabKey = (v: string | null): v is TabKey =>
  v === "categories" || v === "taxonomy" || v === "quickpicks" || v === "defaults";

const GlobalSettings = () => {
  const { has } = useAuth();
  const allowed = has("category.manage");

  const [params, setParams] = useSearchParams();
  const active: TabKey = useMemo(() => {
    const t = params.get("tab");
    return isTabKey(t) ? t : "categories";
  }, [params]);

  if (!allowed) return <Navigate to="/dashboard" replace />;

  const selectTab = (key: TabKey) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", key);
      return next;
    }, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Settings globales"
        description="Categorías, taxonomía de sentimiento y quick-picks de fichas."
      />

      <nav
        role="tablist"
        aria-label="Settings globales"
        className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-1 overflow-x-auto snap-x snap-mandatory border-b border-slate-200 mb-4"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(tab.key)}
              className={
                "snap-start whitespace-nowrap px-3 md:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " +
                (isActive
                  ? "text-marine border-marine"
                  : "text-slate-500 border-transparent hover:text-slate-700")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section role="tabpanel">
        {active === "categories" && <CategoriesTab />}
        {active === "taxonomy" && <SentimentTaxonomyTab />}
        {active === "quickpicks" && <QuickpicksTab />}
        {active === "defaults" && <DefaultsTab />}
      </section>
    </div>
  );
};

export default GlobalSettings;
