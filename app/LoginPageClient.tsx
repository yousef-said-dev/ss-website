"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import { User, Lock, ArrowLeft } from "lucide-react";

export default function LoginPageClient() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-3xl w-full max-w-md animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-sky-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)]">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-sky-200">
            تسجيل الدخول
          </h1>
          <p className="text-slate-400 mt-2">لوحة تحكم مدير النظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-300">الرقم القومي</label>
            <div className="relative flex items-center">
              <User className="absolute right-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="national_id"
                required
                className="w-full glass-input rounded-xl py-3 pr-10 pl-4 transition-shadow focus:shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                placeholder="أدخل الرقم القومي"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
            <div className="relative flex items-center">
              <Lock className="absolute right-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                className="w-full glass-input rounded-xl py-3 pr-10 pl-4 transition-shadow focus:shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "دخول الأن"}
            {!loading && <ArrowLeft className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
