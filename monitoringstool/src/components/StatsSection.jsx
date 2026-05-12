import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend, PieChart, Pie } from "recharts";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { smileys } from "../constants/ratings";
import { CONSENT_QUESTION_UUID } from "../constants/consent";
import { getLocations } from "../constants/locations";

const DEFAULT_LOCATIONS = [
  { key: "", label: "Alle locaties" },
  { key: "Zaanstad", label: "PI Zaanstad" },
  { key: "Veenhuizen", label: "PI Veenhuizen" },
  { key: "Almelo", label: "PI Almelo" },
];

const COLOR_BY_VALUE = {
  rood: "#f05c5c",
  beige: "#f6cfa2",
  geel: "#f7e48a",
  lichtgroen: "#b5ea90",
  groen: "#3ed474",
};

const LABEL_TO_KEY = {
  "Helemaal niet leuk": "rood",
  "Niet leuk": "beige",
  "Gewoon": "geel",
  "Leuk": "lichtgroen",
  "Heel leuk": "groen",
  "1 - Helemaal niet leuk": "rood",
  "2 - Niet leuk": "beige",
  "3 - Gewoon": "geel",
  "4 - Leuk": "lichtgroen",
  "5 - Heel leuk": "groen",
};

function resolveKey(value) {
  return LABEL_TO_KEY[value] || value;
}

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
  const [chartType, setChartType] = useState("bar");
  const [isExporting, setIsExporting] = useState(false);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);

  useEffect(() => {
    getLocations().then(list => {
      if (list && list.length > 0) {
        const dynamic = [
          { key: "", label: "Alle locaties" },
          ...list.map(l => ({ key: l.name, label: `PI ${l.name}` })),
        ];
        setLocations(dynamic);
        setCompLocation(list[0].name);
      }
    }).catch(() => {});
  }, []);

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

  // Export to PDF
  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(13, 148, 136);
      pdf.text(`Monitoring Statistieken`, 14, 16);
      pdf.setFontSize(12);
      pdf.setTextColor(80);
      pdf.text(`${activeTab === "regular" ? "Regulier" : "Ouder-kind dagen"} | ${chartType === "pie" ? "Cirkel" : "Staaf"}`, 14, 23);
      
      if (selectedLocation) {
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(selectedLocation, 14, 29);
      }

      let yPos = selectedLocation ? 35 : 28;
      
      for (let i = 0; i < paginatedData.length; i++) {
        const q = paginatedData[i];
        const entries = Object.entries(q.counts || {});
        const total = entries.reduce((sum, [, c]) => sum + Number(c), 0);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0);
        pdf.text(`${i + 1}. ${q.question_title}`, 14, yPos);
        
        if (chartType === "pie") {
          const pieRadius = 10;
          const pieCx = 30;
          const pieCy = yPos + 14;

          let startAngle = 0;
          let legendX = 55;
          entries.forEach(([key, count]) => {
            const sliceAngle = (Number(count) / total) * 360;
            const resolvedKey = resolveKey(key);
            const color = COLOR_BY_VALUE[resolvedKey];
            const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;

            if (color && sliceAngle > 0) {
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);

              const sliceRad = sliceAngle * Math.PI / 180;
              const startRad = (startAngle - 90) * Math.PI / 180;
              const segments = Math.max(3, Math.ceil(sliceAngle / 5));

              const pts = [];
              const x1 = pieCx + pieRadius * Math.cos(startRad);
              const y1 = pieCy + pieRadius * Math.sin(startRad);
              pts.push([x1 - pieCx, y1 - pieCy]);

              let prevX = x1, prevY = y1;
              for (let i = 1; i <= segments; i++) {
                const angle = startRad + sliceRad * (i / segments);
                const x = pieCx + pieRadius * Math.cos(angle);
                const y = pieCy + pieRadius * Math.sin(angle);
                pts.push([x - prevX, y - prevY]);
                prevX = x; prevY = y;
              }
              pts.push([pieCx - prevX, pieCy - prevY]);

              pdf.setFillColor(r, g, b);
              pdf.setDrawColor(255, 255, 255);
              pdf.setLineWidth(0.3);
              pdf.lines(pts, pieCx, pieCy, [1, 1], "FD");

              startAngle += sliceAngle;
            }

            const label = smileys.find(s => s.key === resolvedKey)?.label || key;
            const c = COLOR_BY_VALUE[resolvedKey];
            if (c) {
              pdf.setFillColor(parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16));
              pdf.rect(legendX, yPos + 3, 4, 4, "F");
            }
            pdf.setFontSize(7);
            pdf.setTextColor(80);
            pdf.text(`${label}: ${pct}%`, legendX + 6, yPos + 6);
            legendX += 28;
          });

          yPos += 28;
        } else {
          // Horizontal bars
          const barStartX = 14;
          const maxBarWidth = 180;
          let barY = yPos + 4;
          
          entries.forEach(([key, count]) => {
            const resolvedKey = resolveKey(key);
            const label = smileys.find(s => s.key === resolvedKey)?.label || key;
            const color = COLOR_BY_VALUE[resolvedKey];
            const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
            
            if (color) {
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const bl = parseInt(color.slice(5, 7), 16);
              const barWidth = (pct / 100) * maxBarWidth;
              
              pdf.setFillColor(r, g, bl);
              pdf.rect(barStartX, barY, barWidth, 5, "F");
              
              pdf.setFontSize(8);
              pdf.setTextColor(50);
              pdf.text(`${label}: ${pct}% (${count})`, barStartX + barWidth + 5, barY + 4);
              
              barY += 7;
            }
          });
          
          yPos += 35;
        }
        
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 15;
        }
      }
      
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Statistieken | ${new Date().toLocaleDateString("nl-NL")}`, 14, pageHeight - 5);
      
      pdf.save(`statistieken-${chartType}-${activeTab}-${selectedLocation || "alle"}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Exporteren mislukt. Probeer het opnieuw.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to calculate weighted average (1-5) for a question object
  const calculateAverage = (question) => {
    if (!question || !question.counts) return null;
    let totalScore = 0;
    let totalCount = 0;
    
    Object.entries(question.counts).forEach(([key, count]) => {
      const numCount = Number(count);
      const resolvedKey = resolveKey(key);
      if (WEIGHTS[resolvedKey] && numCount > 0) {
        totalScore += WEIGHTS[resolvedKey] * numCount;
        totalCount += numCount;
      }
    });

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
        <div className="flex gap-2">
          <button
            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
            onClick={onRefresh}
            disabled={statsLoading}
          >
            {statsLoading ? "Vernieuwen..." : "Vernieuw"}
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded flex items-center gap-2 disabled:opacity-50"
            onClick={handleExportPDF}
            disabled={isExporting || !hasData}
          >
            <Download size={16} />
            {isExporting ? "Exporteren..." : "PDF"}
          </button>
        </div>
      </div>

      {/* Controls Container: Tabs + Chart Type + Locatie Dropdown */}
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

        {/* Chart Type Toggle */}
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${chartType === "bar" ? "bg-yellow-400 text-teal-900" : "bg-teal-600"}`}
            onClick={() => setChartType("bar")}
          >
            Staaf
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${chartType === "pie" ? "bg-yellow-400 text-teal-900" : "bg-teal-600"}`}
            onClick={() => setChartType("pie")}
          >
            Cirkel
          </button>
        </div>

        {/* Locatie Dropdown (Filters the Bar Charts) */}
        <div className="flex items-center gap-2">
          <label className="text-gray-200 text-sm font-semibold">Filter Bar Charts:</label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded cursor-pointer border-none outline-none font-semibold"
          >
            {locations.map((loc) => (
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

      {/* Charts - Bar or Pie */}
      <div className="bg-teal-700 p-4 rounded mb-8">
        {statsLoading ? (
          <div>Laden...</div>
        ) : !hasData ? (
          <div className="text-gray-200 italic">Geen data beschikbaar voor deze selectie.</div>
        ) : chartType === "bar" ? (
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
                const entries = Object.entries(question.counts || {});
                const merged = {};
                entries.forEach(([value, count]) => {
                  const resolvedKey = resolveKey(value);
                  merged[resolvedKey] = (merged[resolvedKey] || 0) + Number(count);
                });
                const chartData = Object.entries(merged).map(([resolvedKey, count]) => {
                  const label = smileys.find((s) => s.key === resolvedKey)?.label || resolvedKey;
                  return {
                    value: resolvedKey,
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
                      <div className="min-h-[250px]">
                      <ResponsiveContainer width="100%" height={250}>
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
) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paginatedData.map((question) => {
              const entries = Object.entries(question.counts || {});
              const merged = {};
              entries.forEach(([value, count]) => {
                const resolvedKey = resolveKey(value);
                merged[resolvedKey] = (merged[resolvedKey] || 0) + Number(count);
              });
              const resolvedEntries = Object.entries(merged).map(([resolvedKey, count]) => {
                const label = smileys.find((s) => s.key === resolvedKey)?.label || resolvedKey;
                return { resolvedKey, label, count };
              });
              const total = resolvedEntries.reduce((sum, e) => sum + e.count, 0);
              const pieData = resolvedEntries.map((e) => ({
                name: e.label,
                value: e.count,
                percentage: total > 0 ? ((e.count / total) * 100).toFixed(1) : 0,
              }));

              return (
                <div key={question.question_uuid} className="bg-gradient-to-br from-teal-800/80 to-teal-700/70 border border-teal-600/40 rounded-xl p-4">
                  <h4 className="font-semibold text-sm mb-4 text-center">{question.question_title}</h4>
                  <div className="min-h-[250px]">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={COLOR_BY_VALUE[resolvedEntries[index].resolvedKey] || "#60a5fa"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
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
                {locations.filter(l => l.key !== "").map((loc) => (
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