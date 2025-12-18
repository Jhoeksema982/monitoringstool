import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { smileys } from "../constants/ratings";

const COLOR_BY_VALUE = {
  rood: "#f05c5c",
  beige: "#f6cfa2",
  geel: "#f7e48a",
  lichtgroen: "#b5ea90",
  groen: "#3ed474",
};

const TABS = [
  { key: "regular", label: "Regulier" },
  { key: "ouder_kind", label: "Ouder-kind dagen" },
];

export default function StatsSection({ statsData, statsLoading, statsError, onRefresh }) {
  const [activeTab, setActiveTab] = useState("regular");
  const chartsPerPage = 6;
  const [page, setPage] = useState(1);

  // Filter stats by survey_type
  const filteredStats = useMemo(() => {
    if (!Array.isArray(statsData)) return [];
    return statsData.filter((q) => q.survey_type === activeTab);
  }, [statsData, activeTab]);

  const hasData = filteredStats.length > 0;
  const totalPages = Math.max(1, Math.ceil((filteredStats?.length || 0) / chartsPerPage));
  
  const paginatedData = useMemo(() => {
    if (!hasData) return [];
    const start = (page - 1) * chartsPerPage;
    return filteredStats.slice(start, start + chartsPerPage);
  }, [chartsPerPage, hasData, page, filteredStats]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Statistieken</h2>
        <button
          className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
          onClick={onRefresh}
          disabled={statsLoading}
        >
          {statsLoading ? "Vernieuwen..." : "Vernieuw"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === tab.key
                ? "bg-yellow-400 text-teal-900"
                : "bg-teal-600 hover:bg-teal-500 text-white"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {statsError && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{statsError}</div>
      )}

      <div className="bg-teal-700 p-4 rounded">
        {statsLoading ? (
          <div>Laden...</div>
        ) : !hasData ? (
          <div>Geen data beschikbaar.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-100">
              {smileys.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_BY_VALUE[key] }} />
                  <span className="uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedData.map((question) => {
                const entries = Object.entries(question.counts || {}).filter(
                  ([value]) => COLOR_BY_VALUE[value]
                );
                const chartData = entries.map(([value, count]) => {
                  const label = smileys.find((s) => s.key === value)?.label || value;
                  return {
                    value,
                    count,
                    label,
                  };
                });

                return (
                  <div
                    key={question.question_uuid}
                    className="bg-gradient-to-br from-teal-800/80 to-teal-700/70 border border-teal-600/40 rounded-xl p-4 flex flex-col gap-4"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-teal-200/80 mb-1">
                        Vraag
                      </p>
                      <h3 className="font-semibold text-base leading-snug text-teal-50">{question.question_title}</h3>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                          <XAxis dataKey="label" stroke="#e5e7eb" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} stroke="#e5e7eb" tick={{ fontSize: 11 }} />
                          <Tooltip
                            cursor={{ fill: "rgba(15,118,110,0.2)" }}
                            contentStyle={{ backgroundColor: "#0f766e", border: "none", borderRadius: "0.5rem" }}
                            labelStyle={{ color: "#f9fafb" }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                            {chartData.map((entry) => (
                              <Cell key={entry.value} fill={COLOR_BY_VALUE[entry.value] || "#60a5fa"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
              );
            })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 text-sm">
                <button
                  className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Vorige
                </button>
                <span className="text-gray-200">
                  Pagina {page} van {totalPages}
                </span>
                <button
                  className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Volgende
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


