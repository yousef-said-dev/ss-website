import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";

const cairo = Cairo({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Smart Scan Admin",
  description: "نظام إدارة الحضور والطلاب الذكي",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} min-h-screen flex flex-col`}>
        {session && <Navbar role={session.role} />}
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
