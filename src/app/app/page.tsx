import { redirect } from "next/navigation";

import { workspacePath } from "@/lib/auth/navigation";
import { requireCompleteProfile } from "@/lib/auth/server";

export default async function AppHomePage() {
  const profile = await requireCompleteProfile();
  redirect(workspacePath(profile.account_type));
}
