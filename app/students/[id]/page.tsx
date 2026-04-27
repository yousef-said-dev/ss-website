import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { User, Calendar, Clock, UserX, UserCheck, ShieldAlert, ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function StudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await params;
  const studentId = parseInt(id);
  if (isNaN(studentId)) notFound();

  const student = await prisma.students.findUnique({
    where: { id: studentId },
    include: {
      users: true, // parent
      attendance: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!student) notFound();

  // If parent, only allow viewing their own child
  if (session.role === "parent") {
    const parentUser = await prisma.users.findUnique({ where: { id: session.userId } });
    if (!parentUser || student.parent_id !== parentUser.id) {
      redirect("/");
    }
  }

  // Attendance stats
  const totalAttendance = student.attendance.length;
  const presentCount = student.attendance.filter((a: any) => a.status === "present").length;
  const lateCount = student.attendance.filter((a: any) => a.status === "late").length;
  const absentCount = student.attendance.filter((a: any) => a.status === "absent").length;
  const presentPercent = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : 0;
  const latePercent = totalAttendance ? Math.round((lateCount / totalAttendance) * 100) : 0;
  const absentPercent = totalAttendance ? Math.round((absentCount / totalAttendance) * 100) : 0;

  // Get rules and check which ones the student broke
  const rules = await prisma.rules.findMany();
  const brokenRules: any[] = [];

  for (const rule of rules) {
    const atts = [...student.attendance].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let broken = false;

    if (rule.frequency === "separate") {
      const count = atts.filter((a: any) => a.status === rule.type).length;
      if (count >= rule.period_days) broken = true;
    } else if (rule.frequency === "continuous") {
      let streak = 0;
      for (const a of atts) {
        if (a.status === rule.type) {
          streak++;
          if (streak >= rule.period_days) { broken = true; break; }
        } else {
          streak = 0;
        }
      }
    }

    if (broken) {
      brokenRules.push(rule);
    }
  }

  // Group attendance by month for visual display
  const monthlyData: { [key: string]: any[] } = {};
  student.attendance.forEach((a: any) => {
    const monthKey = format(new Date(a.date), "yyyy/MM");
    if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
    monthlyData[monthKey].push(a);
  });

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-in fade-in duration-500 space-y-8">
      {/* Back button for admin */}
      {session.role === "admin" && (
        <Link href="/students" className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors text-sm w-fit">
          <ArrowRight className="w-4 h-4" />
          <span>العودة للطلاب</span>
        </Link>
      )}

      {/* Student Header */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-sky-400 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)]">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="text-center md:text-right flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{student.full_name}</h1>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium">المرحلة: {student.year}</span>
              <span className="bg-sky-500/20 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium">الفصل: {student.class}</span>
              <span className="bg-slate-500/20 text-slate-300 px-4 py-1.5 rounded-full text-sm font-medium">الرقم القومي: {student.national_id}</span>
            </div>
            {student.users && (
              <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm justify-center md:justify-start">
                <Phone className="w-4 h-4" />
                <span>ولي الأمر: {student.users.name} {student.users.phone ? `- ${student.users.phone}` : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl text-center border-t-2 border-t-blue-500">
          <p className="text-slate-400 text-xs mb-2">إجمالي الأيام</p>
          <p className="text-3xl font-bold text-white">{totalAttendance}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center border-t-2 border-t-emerald-500">
          <p className="text-slate-400 text-xs mb-2">حضور</p>
          <p className="text-3xl font-bold text-emerald-400">{presentCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">{presentPercent}%</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center border-t-2 border-t-amber-500">
          <p className="text-slate-400 text-xs mb-2">تأخير</p>
          <p className="text-3xl font-bold text-amber-400">{lateCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">{latePercent}%</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center border-t-2 border-t-rose-500">
          <p className="text-slate-400 text-xs mb-2">غياب</p>
          <p className="text-3xl font-bold text-rose-400">{absentCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">{absentPercent}%</p>
        </div>
      </div>

      {/* Attendance Percentage Bar */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-300 mb-4">نسبة الحضور الإجمالية</h3>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
          {presentPercent > 0 && <div className="bg-emerald-500 h-full transition-all" style={{ width: `${presentPercent}%` }}></div>}
          {latePercent > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${latePercent}%` }}></div>}
          {absentPercent > 0 && <div className="bg-rose-500 h-full transition-all" style={{ width: `${absentPercent}%` }}></div>}
        </div>
        <div className="flex gap-6 mt-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> حضور {presentPercent}%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> تأخير {latePercent}%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> غياب {absentPercent}%</span>
        </div>
      </div>

      {/* Broken Rules */}
      {brokenRules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            القواعد المخالفة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokenRules.map((rule) => (
              <div key={rule.id} className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">
                      {rule.period_days} أيام {rule.type === "late" ? "تأخير" : "غياب"} {rule.frequency === "continuous" ? "متصلة" : "منفصلة"}
                    </p>
                    <p className="text-xs text-rose-300/70 mt-1">تم تجاوز الحد المسموح لهذه القاعدة</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Attendance History */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-sky-300 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          سجل الحضور الكامل
        </h2>

        {Object.keys(monthlyData).length > 0 ? (
          Object.entries(monthlyData).map(([month, records]) => (
            <div key={month} className="glass-panel rounded-2xl overflow-hidden">
              <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                <h3 className="font-bold text-slate-200">{month}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[500px]">
                  <thead className="bg-white/3 text-slate-400 text-xs">
                    <tr>
                      <th className="px-6 py-3">التاريخ</th>
                      <th className="px-6 py-3">اليوم</th>
                      <th className="px-6 py-3">الحالة</th>
                      <th className="px-6 py-3">وقت الوصول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((record: any) => {
                      const d = new Date(record.date);
                      const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
                      return (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-slate-300">{format(d, "yyyy/MM/dd")}</td>
                          <td className="px-6 py-3 text-slate-400">{dayNames[d.getDay()]}</td>
                          <td className="px-6 py-3">
                            {record.status === "present" && (
                              <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <UserCheck className="w-3 h-3" /> حضور
                              </span>
                            )}
                            {record.status === "late" && (
                              <span className="bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> تأخير
                              </span>
                            )}
                            {record.status === "absent" && (
                              <span className="bg-rose-500/15 text-rose-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <UserX className="w-3 h-3" /> غياب
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-slate-400 font-mono" dir="ltr">{record.arrival_time || "--:--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
            لا يوجد سجلات حضور لهذا الطالب بعد
          </div>
        )}
      </div>
    </div>
  );
}
