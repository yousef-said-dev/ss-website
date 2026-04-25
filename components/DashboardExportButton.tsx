"use client";

import { format } from "date-fns";
import ExportExcelButton from "./ExportExcelButton";

export default function DashboardExportButton({ todaysAttendance }: { todaysAttendance: any[] }) {
  return (
    <ExportExcelButton 
      data={todaysAttendance}
      fileName={`attendance_${format(new Date(), 'yyyy_MM_dd')}`}
      getLevel={(r: any) => r.students?.year || "Unknown"}
      mapRow={(r: any) => ({
        "التاريخ": format(new Date(r.date), 'yyyy/MM/dd'),
        "الاسم": r.students?.full_name || "-",
        "الرقم القومي": r.students?.national_id || "-",
        "المرحلة": r.students?.year || "-",
        "الفصل": r.students?.class || "-",
        "الحالة": r.status === "present" ? "حضور" : r.status === "late" ? "تأخير" : "غياب",
        "وقت الوصول": r.arrival_time || "-"
      })}
      className="text-sky-400 text-xs hover:underline flex items-center gap-1"
      buttonText="تصدير"
    />
  );
}
