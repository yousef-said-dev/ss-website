"use client";

import { useState } from "react";
import { Plus, Trash2, X, AlertTriangle, Users, ShieldAlert } from "lucide-react";
import { createRule, deleteRule } from "@/app/actions/rules";

export default function RulesClient({ initialRules, students }: { initialRules: any[], students: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Determine offenders for a rule
  const getOffenders = (rule: any) => {
    const offenders: any[] = [];
    
    students.forEach((student) => {
      // sort attendance by date oldest to newest
      const atts = [...(student.attendance || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let broken = false;
      
      if (rule.frequency === "separate") {
        const count = atts.filter(a => a.status === rule.type).length;
        if (count >= rule.period_days) broken = true;
      } else if (rule.frequency === "continuous") {
        let streak = 0;
        for (const a of atts) {
          if (a.status === rule.type) {
            streak++;
            if (streak >= rule.period_days) {
              broken = true;
              break;
            }
          } else {
            streak = 0;
          }
        }
      }
      
      if (broken) {
        offenders.push(student);
      }
    });
    
    return offenders;
  };

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormMsg({ type: "", text: "" });
    const formData = new FormData(e.currentTarget);
    const res = await createRule(formData);
    
    if (res?.error) {
      setFormMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setFormMsg({ type: "success", text: res.success });
      setTimeout(() => setShowAdd(false), 1500);
    }
  }

  async function handleDelete(id: number) {
    if (confirm("هل أنت متأكد من حذف هذه القاعدة؟")) {
      await deleteRule(id);
      if (selectedRule?.id === id) setSelectedRule(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Rules List Column */}
      <div className="lg:col-span-1 space-y-4">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full btn-primary py-3 rounded-2xl flex items-center justify-center gap-2 font-bold mb-6 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-shadow"
        >
          <Plus /> إضافة قاعدة جديدة
        </button>

        {initialRules.map((rule) => (
          <div 
            key={rule.id} 
            onClick={() => setSelectedRule(rule)}
            className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all ${selectedRule?.id === rule.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'hover:border-white/20'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${rule.type === 'late' ? 'text-amber-400' : 'text-rose-400'}`} />
                <h3 className="font-bold text-white text-lg">
                  {rule.period_days} أيام {rule.type === "late" ? "تأخير" : "غياب"}
                </h3>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300">
              النوع: <span className="text-sky-300 font-medium">{rule.frequency === "continuous" ? "متصلة" : "منفصلة"}</span>
            </p>
          </div>
        ))}
        {initialRules.length === 0 && (
          <div className="text-center p-6 text-slate-400 text-sm">لا يوجد قواعد حالياً. أضف قاعدة لتبدأ.</div>
        )}
      </div>

      {/* Selected Rule Details & Offenders Column */}
      <div className="lg:col-span-2">
        {selectedRule ? (
          <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-purple-500/20 to-sky-500/20 p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  مخالفي قاعدة: {selectedRule.period_days} أيام {selectedRule.type === "late" ? "تأخير" : "غياب"} {selectedRule.frequency === "continuous" ? "متصلة" : "منفصلة"}
                </h2>
                <p className="text-purple-200 text-sm">قائمة الطلاب الذين تجاوزوا الحد المسموح</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                <Users className="text-purple-200" />
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const offenders = getOffenders(selectedRule);
                return offenders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offenders.map(s => (
                      <div key={s.id} className="bg-slate-800/80 p-4 rounded-2xl border border-rose-500/30 hover:border-rose-500/60 transition-colors">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
                            !
                          </div>
                          <div>
                            <p className="text-white font-bold truncate max-w-[200px]" title={s.full_name}>{s.full_name}</p>
                            <p className="text-xs text-slate-400 mt-1">المرحلة: {s.year} - فصل: {s.class}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-emerald-300 font-bold text-xl mb-1">لا يوجد مخالفين</p>
                    <p className="text-slate-400 text-sm">جميع الطلاب ملتزمون بهذه القاعدة</p>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="glass-panel h-full min-h-[300px] rounded-3xl flex items-center justify-center flex-col text-slate-400 border border-dashed border-white/20">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
            <p>اختر قاعدة لعرض تفاصيلها والمخالفين لها</p>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md relative animate-in zoom-in-95 duration-200 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white text-center">إضافة قاعدة جديدة</h2>

            {formMsg.text && (
              <div className={`p-3 rounded-xl mb-4 text-sm text-center ${formMsg.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">نوع المخالفة</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-xl cursor-pointer border border-transparent hover:border-white/10 transition-colors">
                    <input type="radio" name="type" value="late" required className="accent-amber-500" />
                    <span className="text-slate-200">تأخير</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-xl cursor-pointer border border-transparent hover:border-white/10 transition-colors">
                    <input type="radio" name="type" value="absent" className="accent-rose-500" />
                    <span className="text-slate-200">غياب</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">تكرار المخالفة</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-xl cursor-pointer border border-transparent hover:border-white/10 transition-colors">
                    <input type="radio" name="frequency" value="continuous" required className="accent-sky-500" />
                    <span className="text-slate-200">متصل (أيام متتالية)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-xl cursor-pointer border border-transparent hover:border-white/10 transition-colors">
                    <input type="radio" name="frequency" value="separate" className="accent-sky-500" />
                    <span className="text-slate-200">منفصل (أيام متفرقة)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">عدد الأيام</label>
                <input type="number" name="period_days" min="1" required className="w-full glass-input rounded-xl py-3 px-4" placeholder="مثال: 5" />
              </div>

              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                حفظ القاعدة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
