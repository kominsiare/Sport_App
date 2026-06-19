import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const safeNext = params.next?.startsWith("/app") ? params.next : "/app";

  return <LoginForm nextPath={safeNext} />;
}
