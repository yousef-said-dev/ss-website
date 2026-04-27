"use client";

import { useState, useMemo } from "react";
import { Search, LayoutList, LayoutGrid, Filter, PieChart, ChevronDown, ChevronRight, Download } from "lucide-react";
import { format, isToday, isAfter, isBefore, subDays, startOfDay } from "date-fns";
import ExportExcelButton from "@/components/ExportExcelButton";

export default function AttendanceClient({ initialData }: { initialData: any[] }) {
  const [view, setView] = useState<"rows" | "cards">("rows");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("today"); // today, week, month, all
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract unique dates that have data
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(initialData.map(r => format(new Date(r.date), 'yyyy-MM-dd'))));
    return dates.sort((a, b) => b.localeCompare(a)); // Descending
  }, [initialData]);

  const filtered = useMemo(() => {
    let result = initialData;

    // Filter by period or specific date
    if (selectedDate) {
      result = result.filter(r => format(new Date(r.date), 'yyyy-MM-dd') === selectedDate);
    } else if (period === "today") {
      result = result.filter(r => isToday(new Date(r.date)));
    } else if (period === "week") {
      const lastWeek = subDays(new Date(), 7);
      result = result.filter(r => isAfter(new Date(r.date), lastWeek));
    } else if (period === "month") {
      const lastMonth = subDays(new Date(), 30);
      result = result.filter(r => isAfter(new Date(r.date), lastMonth));
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => {
        const nameMatch = r.students?.full_name?.toLowerCase().includes(q);
        const idMatch = r.students?.national_id?.toLowerCase().includes(q);
        return nameMatch || idMatch;
      });
    }

    return result;
  }, [initialData, period, selectedDate, statusFilter, search]);

  // Group by level -> class for Cards view
  const grouped = filtered.reduce((acc: any, record) => {
    const s = record.students;
    if (!s) return acc;
    const l = s.year || "Unknown";
    const c = s.class || "Unknown";
    if (!acc[l]) acc[l] = {};
    if (!acc[l][c]) acc[l][c] = [];
    acc[l][c].push(record);
    return acc;
  }, {});

  // Analytics for currently filtered data
  const totalCount = filtered.length;
  const presentCount = filtered.filter((r) => r.status === "present").length;
  const lateCount = filtered.filter((r) => r.status === "late").length;
  const absentCount = filtered.filter((r) => r.status === "absent").length;
  
  const presentPct = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
  const latePct = totalCount ? Math.round((lateCount / totalCount) * 100) : 0;
  const absentPct = totalCount ? Math.round((absentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500 flex flex-col justify-between">
          <p className="text-sm text-slate-400">إجمالي السجلات</p>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-sm text-slate-400">حضور</p>
              <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
            </div>
            <span className="text-xs font-bold text-emerald-500/50 group-hover:text-emerald-500 transition-colors">{presentPct}%</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 w-full">
            <div className="h-full bg-emerald-500" style={{ width: `${presentPct}%` }}></div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-sm text-slate-400">تأخير</p>
              <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
            </div>
            <span className="text-xs font-bold text-amber-500/50 group-hover:text-amber-500 transition-colors">{latePct}%</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-amber-500/20 w-full">
            <div className="h-full bg-amber-500" style={{ width: `${latePct}%` }}></div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 relative overflow-hidden group">
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-sm text-slate-400">غياب</p>
              <p className="text-2xl font-bold text-rose-400">{absentCount}</p>
            </div>
            <span className="text-xs font-bold text-rose-500/50 group-hover:text-rose-500 transition-colors">{absentPct}%</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-rose-500/20 w-full">
            <div className="h-full bg-rose-500" style={{ width: `${absentPct}%` }}></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
             <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث وتصفية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl py-2 pr-10 pl-4 text-sm"
            />
          </div>
          <select
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setSelectedDate(""); }}
            className="glass-input rounded-xl py-2 px-4 text-sm appearance-none"
          >
            <option value="today" className="bg-slate-900">اليوم فقط</option>
            <option value="week" className="bg-slate-900">آخر 7 أيام</option>
            <option value="month" className="bg-slate-900">آخر 30 يوم</option>
            <option value="all" className="bg-slate-900">كل السجلات</option>
          </select>
          <select
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); if(e.target.value) setPeriod(""); }}
            className="glass-input rounded-xl py-2 px-4 text-sm appearance-none border border-sky-500/30"
          >
            <option value="" className="bg-slate-900">اختر يوماً محدداً...</option>
            {availableDates.map(date => (
              <option key={date} value={date} className="bg-slate-900">{date}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input rounded-xl py-2 px-4 text-sm appearance-none"
          >
            <option value="" className="bg-slate-900">كل الحالات</option>
            <option value="present" className="bg-emerald-900">حضور</option>
            <option value="late" className="bg-amber-900">تأخير</option>
            <option value="absent" className="bg-rose-900">غياب</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setView("rows")}
              className={`p-2 rounded-md ${view === "rows" ? "bg-emerald-500 text-white" : "text-slate-400"}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`p-2 rounded-md ${view === "cards" ? "bg-emerald-500 text-white" : "text-slate-400"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          
          <ExportExcelButton 
            data={filtered}
            fileName="attendance_report"
            getLevel={(r) => r.students?.year || "Unknown"}
            mapRow={(r) => ({
              "التاريخ": format(new Date(r.date), 'yyyy/MM/dd'),
              "الاسم": r.students?.full_name || "-",
              "الرقم القومي": r.students?.national_id || "-",
              "المرحلة": r.students?.year || "-",
              "الفصل": r.students?.class || "-",
              "الحالة": r.status === "present" ? "حضور" : r.status === "late" ? "تأخير" : "غياب",
              "وقت الوصول": r.arrival_time || "-"
            })}
            className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors border border-sky-500/30"
          />
        </div>
      </div>

      {/* Rows View */}
      {view === "rows" && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/80 text-emerald-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">التاريخ</th>
                  <th className="px-6 py-4 font-semibold">الطالب</th>
                  <th className="px-6 py-4 font-semibold">الفصل</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">وقت الوصول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-slate-300">{format(new Date(r.date), 'yyyy/MM/dd')}</td>
                    <td className="px-6 py-4 text-white font-medium">{r.students?.full_name}</td>
                    <td className="px-6 py-4 text-slate-400">{r.students?.year} - {r.students?.class}</td>
                    <td className="px-6 py-4">
                      {r.status === "present" && <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs">حضور</span>}
                      {r.status === "late" && <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs">تأخير</span>}
                      {r.status === "absent" && <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs">غياب</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{r.arrival_time || "-"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">لا يوجد سجلات حضور.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {view === "cards" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {Object.keys(grouped).map((level) => {
            const levelId = `level-${level}`;
            const isLevelCollapsed = collapsed[levelId];
            
            return (
              <div key={level} className="space-y-4">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleGroup(levelId)}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    {isLevelCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-emerald-300">المرحلة: {level}</h2>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                      {Object.values(grouped[level]).flat().length} سجل في المرحلة
                    </span>
                  </div>
                </div>

                {!isLevelCollapsed && (
                  <div className="space-y-4 pr-4 border-r border-white/5 mr-4">
                    {Object.keys(grouped[level]).map((cls) => {
                      const classId = `level-${level}-class-${cls}`;
                      const isClassCollapsed = collapsed[classId];

                      return (
                        <div key={cls} className="glass-panel rounded-2xl overflow-hidden border-l-4 border-l-emerald-500/50">
                          <div 
                            className="p-4 bg-white/5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-white/10 transition-colors gap-4"
                            onClick={() => toggleGroup(classId)}
                          >
                            <div className="flex items-center gap-4">
                              <h3 className="font-bold text-slate-300">الفصل: {cls}</h3>
                              <span className="bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-white/5">
                                {grouped[level][cls].length} سجل
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {(() => {
                                const stats = grouped[level][cls].reduce((acc: any, r: any) => {
                                  acc[r.status] = (acc[r.status] || 0) + 1;
                                  return acc;
                                }, {});
                                return (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                      <span className="text-[10px] font-bold text-emerald-400">{stats.present || 0} حضور</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                      <span className="text-[10px] font-bold text-amber-400">{stats.late || 0} تأخير</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                      <span className="text-[10px] font-bold text-rose-400">{stats.absent || 0} غياب</span>
                                    </div>
                                  </>
                                );
                              })()}
                              <div className="text-slate-500 mr-2">
                                {isClassCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {!isClassCollapsed && (
                            <div className="p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {grouped[level][cls].map((r: any) => (
                                  <div key={r.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                                     {r.status === "present" && <div className="absolute top-0 right-0 w-full h-1 bg-emerald-500"></div>}
                                     {r.status === "late" && <div className="absolute top-0 right-0 w-full h-1 bg-amber-500"></div>}
                                     {r.status === "absent" && <div className="absolute top-0 right-0 w-full h-1 bg-rose-500"></div>}
                                     
                                    <p className="font-bold text-white truncate text-lg mt-2" title={r.students?.full_name}>{r.students?.full_name}</p>
                                    <div className="flex justify-between items-center mt-3">
                                      <span className="text-xs text-slate-400">{format(new Date(r.date), 'yyyy/MM/dd')}</span>
                                      <span className="text-xs font-bold font-mono text-emerald-200">{r.arrival_time || "-"}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center p-8 text-slate-400 glass-panel rounded-2xl">لا يوجد سجلات حضور.</div>
          )}
        </div>
      )}
    </div>
  );
}
