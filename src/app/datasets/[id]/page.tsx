import { redirect } from "next/navigation";

export default async function DatasetLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/datasets/${id}`);
}
