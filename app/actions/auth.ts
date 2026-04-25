"use server";

import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const national_id = formData.get("national_id") as string;
  const password = formData.get("password") as string;

  if (!national_id || !password) {
    return { error: "يرجى ملء جميع الحقول" };
  }

  let redirectUrl = "/dashboard";

  try {
    const user = await prisma.users.findUnique({
      where: { national_id },
    });

    if (!user) {
      return { error: "الرقم القومي غير صحيح" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { error: "كلمة المرور غير صحيحة" };
    }

    await createSession(user.id, user.role || "parent");

    // If parent, redirect to their child's profile
    if (user.role === "parent") {
      const student = await prisma.students.findFirst({
        where: { parent_id: user.id },
      });
      if (student) {
        redirectUrl = `/students/${student.id}`;
      } else {
        return { error: "لا يوجد طالب مرتبط بهذا الحساب" };
      }
    }
  } catch (error) {
    return { error: "حدث خطأ أثناء تسجيل الدخول" };
  }

  redirect(redirectUrl);
}

export async function logout() {
  await clearSession();
  redirect("/");
}
