"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRule(formData: FormData) {
  const period_days = parseInt(formData.get("period_days") as string);
  const type = formData.get("type") as string;
  const frequency = formData.get("frequency") as string;

  if (!period_days || !type || !frequency) {
    return { error: "يرجى تعبئة جميع الحقول" };
  }

  try {
    await prisma.rules.create({
      data: {
        period_days,
        type,
        frequency,
      },
    });

    revalidatePath("/rules");
    return { success: "تمت إضافة القاعدة بنجاح" };
  } catch (err: any) {
    return { error: "حدث خطأ: " + err.message };
  }
}

export async function deleteRule(id: number) {
  try {
    await prisma.rules.delete({
      where: { id },
    });
    revalidatePath("/rules");
    return { success: "تم حذف القاعدة بنجاح" };
  } catch (err: any) {
    return { error: "حدث خطأ: " + err.message };
  }
}
