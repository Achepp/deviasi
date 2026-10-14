import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import AdminClientLayout from "@/components/admin/AdminClientLayout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "Admin") {
    redirect("/operator/home");
  }

  return <AdminClientLayout user={session}>{children}</AdminClientLayout>;
}
