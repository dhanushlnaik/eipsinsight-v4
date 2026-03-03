import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { FeedbackDashboard } from "./_components/feedback-dashboard";

export const metadata: Metadata = buildMetadata({
  title: "Admin Feedback",
  description: "Review and manage user feedback submissions.",
  path: "/admin/feedback",
  noIndex: true,
});

export default async function AdminFeedbackPage() {
  const hdrs = await headers();
  const ck = await cookies();
  const headerObj = Object.fromEntries(hdrs.entries());
  headerObj["cookie"] = ck.toString();

  let result: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    result = await auth.api.getSession({ headers: headerObj });
  } catch {
    redirect("/login");
  }

  if (!result?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <FeedbackDashboard />;
}
