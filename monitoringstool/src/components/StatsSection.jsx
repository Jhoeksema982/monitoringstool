import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { smileys } from "../constants/ratings";
import { CONSENT_QUESTION_UUID } from "../constants/consent";

const COLOR_BY_VALUE = {
  rood: "#f05c5c",
  beige: "#f6cfa2",
  geel: "#f7e48a",
  lichtgroen: "#b5ea90",
  groen: "#3ed474",
};

// Values for weighted average calculation (1 = Worst, 5 = Best)
const WEIGHTS = {
  rood: 1,
  beige: 2,
  geel: 3,
  lichtgroen: 4,
  groen: 5,
};

const TABS = [
  { key: "regular", label: "Regulier" },
  { key: "ouder_kind", label: "Ouder-kind dagen" },
];

const LOCATIONS = [
  { key: "", label: "Alle locaties" },
  { key: "Zaanstad", label: "PI Zaanstad" },
  { key: "Veenhuizen", label: "PI Veenhuizen" },
  { key: "Almelo", label: "PI Almelo" },
];

export default function StatsSection({ 
  statsData, 
  globalStats = [], 
  fetchLocationStats, 
  statsLoading, 
  statsError, 
  onRefresh,
  selectedLocation,   
  onLocationChange    
}) {
  const [activeTab, setActiveTab] = useState("regular");
  const chartsPerPage = 6;
  const [page, setPage] = useState(1);

  // --- Comparison Chart State ---
  const [compLocation, setCompLocation] = useState("Zaanstad");
  const [compStats, setCompStats] = useState([]);
  const [compLoading, setCompLoading] = useState(false);

  // Fetch comparison stats when compLocation changes
  useEffect(() => {
    if (fetchLocationStats && compLocation) {
      setCompLoading(true);
      fetchLocationStats(compLocation)
        .then(data => setCompStats(data || []))
        .catch(err => console.error("Failed to load comparison stats", err))
        .finally(() => setCompLoading(false));
    }
  }, [compLocation, fetchLocationStats]);

  // Helper to calculate weighted average (1-5) for a question object
  const calculateAverage = (question) => {
    if (!question || !question.counts) return null;
    let totalScore = 0;
    let totalCount = 0;
    
    Object.entries(question.counts).forEach(([key, count]) => {
      // Ensure count is treated as a number
      const numCount = Number(count);
      if (WEIGHTS[key] && numCount > 0) {
        totalScore += WEIGHTS[key] * numCount;
        totalCount += numCount;
      }
    });

    // Return Number for Recharts
    return totalCount === 0 ? null : Number((totalScore / totalCount).toFixed(2));
  };

  // Prepare Data for Line Chart
  const comparisonChartData = useMemo(() => {
    if (!globalStats || globalStats.length === 0) return [];

    // 1. Get Base Questions from Global Stats (filtered by active tab & consent)
    const relevantGlobal = globalStats.filter(
      q => q.survey_type === activeTab && q.question_uuid !== CONSENT_QUESTION_UUID
    );

    // 2. Map to chart data structure
    return relevantGlobal.map(gQ => {
      // Find matching question in Comparison Stats
      const cQ = compStats.find(q => q.question_uuid === gQ.question_uuid);
      
      return {
        name: gQ.question_title.substring(0, 15) + "...", // Shorten label for axis
        fullName: gQ.question_title, // Full name for tooltip
        globalAvg: calculateAverage(gQ),
        compAvg: calculateAverage(cQ),
      };
    });
  }, [globalStats, compStats, activeTab]);

  // --- End Comparison Logic ---

  // Filter stats by survey_type and exclude consent question (For Bar Charts)
  const filteredStats = useMemo(() => {
    if (!Array.isArray(statsData)) return [];
    return statsData.filter(
      (q) => q.survey_type === activeTab && q.question_uuid !== CONSENT_QUESTION_UUID
    );
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

      {/* Controls Container: Tabs + Locatie Dropdown */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center">
        {/* Tabs */}
        <div className="flex gap-2">
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

        {/* Locatie Dropdown (Filters the Bar Charts) */}
        <div className="flex items-center gap-2">
          <label className="text-gray-200 text-sm font-semibold">Filter Bar Charts:</label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded cursor-pointer border-none outline-none font-semibold"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.key} value={loc.key} className="bg-teal-800">
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {statsError && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{statsError}</div>
      )}

      {/* Existing Bar Charts Grid */}
      <div className="bg-teal-700 p-4 rounded mb-8">
        {statsLoading ? (
          <div>Laden...</div>
        ) : !hasData ? (
          <div className="text-gray-200 italic">Geen data beschikbaar voor deze selectie.</div>
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
                      <h3 className="font-semibold text-base leading-snug text-teal-50 min-h-[3rem]">{question.question_title}</h3>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                          <XAxis dataKey="label" stroke="#e5e7eb" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} stroke="#e5e7eb" tick={{ fontSize: 11 }} />
                          <Tooltip
                            cursor={{ fill: "rgba(15,118,110,0.2)" }}
                            contentStyle={{ backgroundColor: "#0f766e", border: "none", borderRadius: "0.5rem", color: "#fff" }}
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

      {/* NEW: Comparison Chart Section - Updated Styling to Match Theme */}
      <div className="bg-teal-700 p-6 rounded mb-8 border border-teal-600/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Vergelijking: Landelijk vs. PI</h3>
            <p className="text-sm text-gray-200">Gemiddelde score (1=Slecht, 5=Best)</p>
          </div>
          <div className="flex items-center gap-2">
             <label className="text-sm font-semibold text-gray-200">Vergelijk met:</label>
             <select
                value={compLocation}
                onChange={(e) => setCompLocation(e.target.value)}
                className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded cursor-pointer border-none outline-none font-semibold"
             >
               {LOCATIONS.filter(l => l.key !== "").map((loc) => (
                 <option key={loc.key} value={loc.key} className="bg-teal-800">
                   {loc.label}
                 </option>
               ))}
             </select>
          </div>
        </div>

        <div className="h-80 w-full">
           {compLoading ? (
             <div className="h-full flex items-center justify-center text-gray-200">Laden vergelijking...</div>
           ) : (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={comparisonChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                 {/* Lighter grid for dark background */}
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                 
                 {/* Lighter Axis text */}
                 <XAxis dataKey="name" stroke="#e5e7eb" tick={{fontSize: 12, fill: '#e5e7eb'}} interval={0} />
                 <YAxis 
                    domain={[1, 5]} 
                    tickCount={5} 
                    stroke="#e5e7eb"
                    tick={{fill: '#e5e7eb'}}
                    label={{ value: 'Score (1-5)', angle: -90, position: 'insideLeft', fill: '#e5e7eb' }} 
                    allowDataOverflow={true}
                 />
                 
                 <Tooltip 
                    contentStyle={{ backgroundColor: "#0f766e", border: "none", borderRadius: "0.5rem", color: "#fff", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                    itemStyle={{ color: '#fff' }}
                 />
                 
                 {/* Legend text color fix */}
                 <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#e5e7eb' }} />
                 
                 {/* Global Average Line - Subtle Grey/Blue */}
                 <Line 
                    type="monotone" 
                    dataKey="globalAvg" 
                    name="Gemiddelde (Alle PIs)" 
                    stroke="#cbd5e1" // Slate-300 (Visible on dark)
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={{fill: '#cbd5e1'}}
                    connectNulls
                 />
                 
                 {/* Comparison Line - BRIGHT YELLOW (Matches buttons/tabs) */}
                 <Line 
                    type="monotone" 
                    dataKey="compAvg" 
                    name={`PI ${compLocation}`} 
                    stroke="#facc15" // Yellow-400 (High contrast on Teal)
                    strokeWidth={3} 
                    activeDot={{ r: 8, fill: '#facc15' }}
                    dot={{ fill: '#facc15', r: 4 }}
                    connectNulls
                 />
               </LineChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>
    </div>
  );
}