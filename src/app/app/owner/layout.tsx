import { requireAccountType } from "@/lib/auth/server";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccountType("owner");
  return children;
}
