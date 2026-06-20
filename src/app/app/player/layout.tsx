import { requireAccountType } from "@/lib/auth/server";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccountType("player");
  return children;
}
