import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, UserCheck, ShieldAlert, Clock, UserX, Plus, Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import DashboardExportButton from "@/components/DashboardExportButton";

export default async function Dashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch metrics
  const totalStudents = await prisma.students.count();

  const todaysAttendance = await prisma.attendance.findMany({
    where: {
      date: {
        gte: today, // Today from 00:00
      },
    },
    include: { students: true }
  });

  // Check if attendance session has actually started (at least one person arrived)
  const isStarted = todaysAttendance.some((a: any) => a.status === "present" || a.status === "late");

  const presentCount = todaysAttendance.filter((a: any) => a.status === "present").length;
  const lateCount = todaysAttendance.filter((a: any) => a.status === "late").length;
  // Only count absentees if the session has started
  const absentCount = isStarted ? todaysAttendance.filter((a: any) => a.status === "absent").length : 0;

  const totalToday = todaysAttendance.length;
  const presentPercent = totalToday ? Math.round((presentCount / totalToday) * 100) : 0;
  const latePercent = totalToday ? Math.round((lateCount / totalToday) * 100) : 0;
  const absentPercent = isStarted && totalToday ? Math.round((absentCount / totalToday) * 100) : 0;

  const stats = [
    { label: "إجمالي الطلاب", value: totalStudents, icon: Users, color: "from-blue-500 to-sky-400" },
    { label: "حضور اليوم", value: presentCount, percent: presentPercent, icon: UserCheck, color: "from-emerald-500 to-teal-400" },
    { label: "تأخير اليوم", value: lateCount, percent: latePercent, icon: Clock, color: "from-amber-500 to-orange-400" },
    { label: "غياب اليوم", value: absentCount, percent: absentPercent, icon: UserX, color: "from-rose-500 to-red-400" },
  ];

  // Fetch recent activity for today (only show people who arrived)
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      date: { gte: today },
      status: { in: ['present', 'late'] }
    },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: { students: true }
  });


  // Distribution by level
  const studentsByYear = await prisma.students.groupBy({
    by: ['year'],
    _count: { id: true },
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-sky-200">
            لوحة التحكم
          </h1>
          <p className="text-slate-400 mt-2">نظرة عامة على إحصائيات اليوم - {format(new Date(), 'yyyy/MM/dd')}</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-500 font-medium italic">أهلاً بك، {session.role === 'admin' ? 'المدير' : 'الموظف'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl -mr-10 -mt-10 opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-bold text-white shadow-sm">{stat.value}</h3>
                  {stat.percent !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${stat.color}`} 
                          style={{ width: `${stat.percent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold">{stat.percent}%</span>
                    </div>
                  )}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="text-sky-400 w-5 h-5" /> 
              حضور اليوم
            </h2>
            <div className="flex gap-3">
              <DashboardExportButton todaysAttendance={todaysAttendance} />
              <Link href="/attendance" className="text-sky-400 text-xs hover:underline">عرض الكل</Link>
            </div>
          </div>
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[500px]">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">الطالب</th>
                  <th className="px-6 py-4 font-bold">المرحلة</th>
                  <th className="px-6 py-4 font-bold">الوقت</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentAttendance.map((record: any) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-white">{record.students.full_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{record.students.year} - {record.students.class}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono" dir="ltr">{record.arrival_time || '--:--'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        record.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' :
                        record.status === 'late' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {record.status === 'present' ? 'حضور' : record.status === 'late' ? 'تأخير' : 'غياب'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentAttendance.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500 italic">لا توجد سجلات حديثة</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Student Distribution */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-purple-400 w-5 h-5" /> 
            توزيع الطلاب
          </h2>
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            {studentsByYear.length > 0 ? (
              studentsByYear.map((group: any, idx: number) => {
                const percentage = Math.round((group._count.id / totalStudents) * 100);
                const colors = ['bg-sky-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                const color = colors[idx % colors.length];
                
                return (
                  <div key={group.year} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white">{group.year || 'غير محدد'}</span>
                      <span className="text-slate-400">{group._count.id} طالب</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
                <div className="text-center py-12 text-slate-500 italic">لا توجد بيانات متاحة</div>
            )}
          </div>

          <Link href="/students" className="block glass-panel p-4 rounded-2xl border border-dashed border-white/10 hover:border-sky-500/50 transition-colors text-center text-xs text-sky-400 font-bold group">
            <Plus className="inline-block w-3 h-3 ml-1 mb-1 group-hover:rotate-90 transition-transform" />
            إضافة المزيد من الطلاب
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/students" className="glass-panel hover:bg-white/5 transition-all p-8 rounded-3xl group flex flex-col items-center justify-center gap-4 border border-sky-500/20 hover:border-sky-500/50">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8 text-sky-400" />
          </div>
          <h2 className="text-xl font-bold">إدارة الطلاب</h2>
          <p className="text-slate-400 text-center text-sm">عرض وإضافة الطلاب، البحث والتصفية حسب المرحلة والفصل</p>
        </Link>
        
        <Link href="/attendance" className="glass-panel hover:bg-white/5 transition-all p-8 rounded-3xl group flex flex-col items-center justify-center gap-4 border border-emerald-500/20 hover:border-emerald-500/50">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">سجل الحضور</h2>
          <p className="text-slate-400 text-center text-sm">متابعة حضور وانصراف الطلاب، التقارير والإحصائيات</p>
        </Link>

        <Link href="/rules" className="glass-panel hover:bg-white/5 transition-all p-8 rounded-3xl group flex flex-col items-center justify-center gap-4 border border-purple-500/20 hover:border-purple-500/50">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold">إدارة القواعد</h2>
          <p className="text-slate-400 text-center text-sm">تعيين قواعد الغياب والتأخير، ومتابعة الطلاب المخالفين</p>
        </Link>
      </div>
    </div>
  );
}
