"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, ShieldAlert, LogOut, User } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default function Navbar({ role, parentStudentId }: { role: string; parentStudentId?: number }) {
  const pathname = usePathname();

  const adminLinks = [
    { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/students", label: "الطلاب", icon: Users },
    { href: "/attendance", label: "الحضور", icon: UserCheck },
    { href: "/rules", label: "القواعد", icon: ShieldAlert },
  ];

  const parentLinks = parentStudentId
    ? [{ href: `/students/${parentStudentId}`, label: "ملف الطالب", icon: User }]
    : [];

  const links = role === "admin" ? adminLinks : parentLinks;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 mb-6 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30">
            S
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-sky-200">
            Smart Scan
          </span>
        </div>

        <div className="hidden md:flex gap-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive
                    ? "bg-white/10 text-sky-400 font-bold shadow-sm shadow-sky-500/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-4 py-2 rounded-xl hover:bg-red-500/10"
        >
          <span>تسجيل خروج</span>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
