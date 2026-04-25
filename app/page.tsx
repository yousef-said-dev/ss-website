import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginPageClient from "./LoginPageClient";

export default async function Page() {
  const session = await getSession();
  
  if (session?.role === "admin") {
    redirect("/dashboard");
  }

  return <LoginPageClient />;
}
