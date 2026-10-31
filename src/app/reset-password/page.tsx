import { RecoveryForm } from "@/components/RecoveryForm";
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <RecoveryForm
      mode="reset"
      token={params.token}
      initialEmail={params.email}
    />
  );
}
