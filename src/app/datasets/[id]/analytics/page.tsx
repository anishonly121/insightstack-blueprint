import { redirect } from "next/navigation";

export default async function AnalyticsLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/datasets/${id}`);
}
