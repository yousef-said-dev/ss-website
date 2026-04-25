import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import RulesClient from "./RulesClient";

export default async function RulesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const rulesData = await prisma.rules.findMany({
    orderBy: { created_at: "desc" },
  });

  const students = await prisma.students.findMany({
    include: {
      attendance: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <ShieldAlert className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-purple-200">
            إدارة القواعد والمخالفات
          </h1>
          <p className="text-slate-400 mt-1">يمكنك إضافة قواعد الغياب والتأخير ومعرفة الطلاب المخالفين للقواعد</p>
        </div>
      </div>

      <RulesClient initialRules={rulesData} students={students} />
    </div>
  );
}
