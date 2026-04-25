import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Fetch all attendance records with related student data
  const attendanceData = await prisma.attendance.findMany({
    include: {
      students: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Serialize dates for Client Component
  const serializedData = attendanceData.map((record: any) => ({
    ...record,
    date: record.date.toISOString(),
    created_at: record.created_at?.toISOString() || null,
    updated_at: record.updated_at?.toISOString() || null,
  }));

  return (
    <div className="max-w-7xl mx-auto w-full p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <UserCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-emerald-200">
            سجل الحضور
          </h1>
          <p className="text-slate-400 mt-1">متابعة حضور وانصراف الطلاب وإحصائيات الفترات</p>
        </div>
      </div>

      <AttendanceClient initialData={serializedData} />
    </div>
  );
}
