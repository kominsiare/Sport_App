import { AppShell } from "@/components/app/app-shell";
import { requireCompleteProfile } from "@/lib/auth/server";

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireCompleteProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
