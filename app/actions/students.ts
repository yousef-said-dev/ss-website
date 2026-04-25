"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function addStudent(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const national_id = formData.get("national_id") as string;
  const yearLevel = formData.get("year") as string;
  const classroom = formData.get("class") as string;

  if (!full_name || !national_id || !yearLevel || !classroom) {
    return { error: "يرجى ملء جميع الحقول" };
  }

  try {
    const existingStudent = await prisma.students.findUnique({
      where: { national_id },
    });
    if (existingStudent) {
      return { error: "الطالب موجود بالفعل" };
    }

    let parent = await prisma.users.findUnique({
      where: { national_id },
    });

    if (!parent) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      parent = await prisma.users.create({
        data: {
          national_id,
          name: `ولي أمر ${full_name}`,
          password: hashedPassword,
          role: "parent",
          must_change_password: true,
        },
      });
    }

    await prisma.students.create({
      data: {
        national_id,
        full_name,
        year: yearLevel,
        class: classroom,
        parent_id: parent.id,
      },
    });

    revalidatePath("/students");
    return { success: "تمت إضافة الطالب وحساب ولي الأمر بنجاح" };
  } catch (err: any) {
    return { error: "حدث خطأ: " + err.message };
  }
}

export async function updateStudent(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const full_name = formData.get("full_name") as string;
  const national_id = formData.get("national_id") as string;
  const yearLevel = formData.get("year") as string;
  const classroom = formData.get("class") as string;
  const parent_phone = formData.get("parent_phone") as string;

  if (!id || !full_name || !national_id || !yearLevel || !classroom) {
    return { error: "يرجى ملء جميع الحقول" };
  }

  try {
    // Update student
    const student = await prisma.students.update({
      where: { id },
      data: {
        full_name,
        national_id,
        year: yearLevel,
        class: classroom,
      },
    });

    // Update parent phone if provided
    if (parent_phone && student.parent_id) {
      await prisma.users.update({
        where: { id: student.parent_id },
        data: { phone: parent_phone },
      });
    }

    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return { success: "تم تحديث بيانات الطالب بنجاح" };
  } catch (err: any) {
    return { error: "حدث خطأ: " + err.message };
  }
}
