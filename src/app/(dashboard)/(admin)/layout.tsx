import { redirect } from "next/navigation";

import { requireAppSession } from "@/lib/auth/session";

export default async function AdminRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAppSession();

  if (session.role !== "admin") {
    redirect("/");
  }

  return children;
}
