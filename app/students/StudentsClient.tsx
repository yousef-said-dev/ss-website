"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutList, LayoutGrid, Plus, X, Pencil, ChevronDown, ChevronRight, Download } from "lucide-react";
import { addStudent, updateStudent } from "@/app/actions/students";
import ExportExcelButton from "@/components/ExportExcelButton";

export default function StudentsClient({ initialStudents }: { initialStudents: any[] }) {
  const router = useRouter();
  const [view, setView] = useState<"rows" | "cards">("rows");
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = initialStudents.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = s.full_name?.toLowerCase().includes(q);
      const idMatch = s.national_id?.toLowerCase().includes(q);
      if (!nameMatch && !idMatch) return false;
    }
    if (filterLevel && s.year !== filterLevel) return false;
    if (filterClass && s.class !== filterClass) return false;
    return true;
  });

  const levels = Array.from(new Set(initialStudents.map((s) => s.year).filter(Boolean)));
  const classes = Array.from(new Set(initialStudents.map((s) => s.class).filter(Boolean)));

  // Group by level then class for cards view
  const grouped = filtered.reduce((acc: any, s) => {
    const l = s.year || "Unknown";
    const c = s.class || "Unknown";
    if (!acc[l]) acc[l] = {};
    if (!acc[l][c]) acc[l][c] = [];
    acc[l][c].push(s);
    return acc;
  }, {});

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormMsg({ type: "", text: "" });
    const formData = new FormData(e.currentTarget);
    const res = await addStudent(formData);
    if (res?.error) {
      setFormMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setFormMsg({ type: "success", text: res.success });
      e.currentTarget.reset();
      setTimeout(() => setShowAddForm(false), 2000);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormMsg({ type: "", text: "" });
    const formData = new FormData(e.currentTarget);
    const res = await updateStudent(formData);
    if (res?.error) {
      setFormMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setFormMsg({ type: "success", text: res.success });
      setTimeout(() => setEditStudent(null), 1500);
    }
  }

  function goToProfile(id: number) {
    router.push(`/students/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between glass-panel p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="bg-sky-500/10 px-4 py-2 rounded-xl border border-sky-500/20">
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">إجمالي الطلاب</p>
            <p className="text-xl font-bold text-white">{initialStudents.length}</p>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرقم القومي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl py-2 pr-10 pl-4 text-sm"
            />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="glass-input rounded-xl py-2 px-4 text-sm appearance-none"
          >
            <option value="">كل المراحل</option>
            {levels.map((l) => (
              <option key={l} value={l} className="bg-slate-900">{l}</option>
            ))}
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="glass-input rounded-xl py-2 px-4 text-sm appearance-none"
          >
            <option value="">كل الفصول</option>
            {classes.map((c) => (
              <option key={c} value={c} className="bg-slate-900">{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setView("rows")}
              className={`p-2 rounded-md transition-colors ${view === "rows" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`p-2 rounded-md transition-colors ${view === "cards" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          
          <ExportExcelButton 
            data={filtered}
            fileName="students_list"
            getLevel={(s) => s.year || "Unknown"}
            mapRow={(s) => ({
              "الاسم": s.full_name,
              "الرقم القومي": s.national_id,
              "المرحلة": s.year,
              "الفصل": s.class,
              "رقم الهاتف": s.users?.phone || "-"
            })}
            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors border border-emerald-500/30"
          />

          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب</span>
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white text-center">إضافة طالب جديد</h2>

            {formMsg.text && (
              <div className={`p-3 rounded-xl mb-4 text-sm text-center ${formMsg.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">اسم الطالب</label>
                <input type="text" name="full_name" required className="w-full glass-input rounded-xl py-2 px-4" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">الرقم القومي (سيكون رقم وكلمة سر ولي الأمر)</label>
                <input type="text" name="national_id" required className="w-full glass-input rounded-xl py-2 px-4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">المرحلة</label>
                  <input type="text" name="year" required className="w-full glass-input rounded-xl py-2 px-4" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">الفصل</label>
                  <input type="text" name="class" required className="w-full glass-input rounded-xl py-2 px-4" />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-4">
                حفظ البيانات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md relative animate-in zoom-in-95 duration-200 border border-sky-500/30">
            <button onClick={() => { setEditStudent(null); setFormMsg({ type: "", text: "" }); }} className="absolute top-4 left-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white text-center">تعديل بيانات الطالب</h2>

            {formMsg.text && (
              <div className={`p-3 rounded-xl mb-4 text-sm text-center ${formMsg.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <input type="hidden" name="id" value={editStudent.id} />
              <div>
                <label className="text-sm text-slate-300 mb-1 block">اسم الطالب</label>
                <input type="text" name="full_name" defaultValue={editStudent.full_name} required className="w-full glass-input rounded-xl py-2 px-4" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">الرقم القومي</label>
                <input type="text" name="national_id" defaultValue={editStudent.national_id} required className="w-full glass-input rounded-xl py-2 px-4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">المرحلة</label>
                  <input type="text" name="year" defaultValue={editStudent.year} required className="w-full glass-input rounded-xl py-2 px-4" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">الفصل</label>
                  <input type="text" name="class" defaultValue={editStudent.class} required className="w-full glass-input rounded-xl py-2 px-4" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">هاتف ولي الأمر</label>
                <input type="text" name="parent_phone" defaultValue={editStudent.users?.phone || ""} className="w-full glass-input rounded-xl py-2 px-4" placeholder="اختياري" />
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-4">
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rows View */}
      {view === "rows" && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[600px]">
              <thead className="bg-slate-800/80 text-sky-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">الاسم</th>
                  <th className="px-6 py-4 font-semibold">الرقم القومي</th>
                  <th className="px-6 py-4 font-semibold">المرحلة</th>
                  <th className="px-6 py-4 font-semibold">الفصل</th>
                  <th className="px-6 py-4 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => goToProfile(s.id)}>
                    <td className="px-6 py-4 text-white">{s.full_name}</td>
                    <td className="px-6 py-4 text-slate-300">{s.national_id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs">{s.year}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs">{s.class}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditStudent(s); setFormMsg({ type: "", text: "" }); }}
                        className="p-2 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">لا يوجد طلاب مطابقين للبحث.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View (Grouped by Level & Class) */}
      {view === "cards" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {Object.keys(grouped).map((level) => {
            const levelId = `level-${level}`;
            const isLevelCollapsed = collapsed[levelId];

            return (
              <div key={level} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-sky-500/30 pb-2">
                    <h2 className="text-2xl font-bold text-sky-300">المرحلة: {level}</h2>
                    <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-xs font-bold border border-sky-500/20">
                      إجمالي المرحلة: {Object.values(grouped[level]).flat().length} طالب
                    </span>
                  </div>

                {!isLevelCollapsed && (
                  <div className="space-y-6 pr-4 border-r border-white/5 mr-4">
                    {Object.keys(grouped[level]).map((cls) => {
                      const classId = `level-${level}-class-${cls}`;
                      const isClassCollapsed = collapsed[classId];

                      return (
                        <div key={cls} className="glass-panel rounded-2xl overflow-hidden border-l-4 border-l-purple-500">
                          <div 
                            className="p-4 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => toggleGroup(classId)}
                          >
                            <div className="flex items-center gap-4">
                              <h3 className="text-lg font-bold text-purple-300">الفصل: {cls}</h3>
                              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/20">
                                {grouped[level][cls].length} طالب
                              </span>
                            </div>
                            <div className="text-slate-400">
                              {isClassCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>

                          {!isClassCollapsed && (
                            <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {grouped[level][cls].map((s: any) => (
                                  <div
                                    key={s.id}
                                    onClick={() => goToProfile(s.id)}
                                    className="bg-slate-800/50 p-4 rounded-xl border border-white/5 hover:border-sky-500/30 transition-colors cursor-pointer relative group"
                                  >
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditStudent(s); setFormMsg({ type: "", text: "" }); }}
                                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/30 transition-all opacity-0 group-hover:opacity-100"
                                      title="تعديل"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <p className="font-bold text-white truncate text-lg" title={s.full_name}>{s.full_name}</p>
                                    <p className="text-sm text-slate-400 mt-1">{s.national_id}</p>
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
            <div className="text-center p-8 text-slate-400 glass-panel rounded-2xl">لا يوجد طلاب مطابقين للبحث.</div>
          )}
        </div>
      )}
    </div>
  );
}
