import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentsClient from "./StudentsClient";
import { Users } from "lucide-react";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const studentsData = await prisma.students.findMany({
    include: {
      users: true, // parent info for edit modal
    },
    orderBy: [
      { year: "desc" },
      { class: "asc" },
      { full_name: "asc" }
    ]
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.2)]">
          <Users className="w-8 h-8 text-sky-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-sky-200">
            إدارة الطلاب
          </h1>
          <p className="text-slate-400 mt-1">تصفح وإضافة الطلاب، تصفية حسب المرحلة والفصل</p>
        </div>
      </div>

      <StudentsClient initialStudents={studentsData} />
    </div>
  );
}
