import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import OperatorClientLayout from "@/components/operator/OperatorClientLayout";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "Operator") {
    redirect("/admin/dashboard");
  }

  return <OperatorClientLayout user={session}>{children}</OperatorClientLayout>;
}
