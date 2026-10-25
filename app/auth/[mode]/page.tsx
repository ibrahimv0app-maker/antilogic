import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm, type AuthMode } from "@/app/components/auth-form";

const modes = ["sign-in", "sign-up", "forgot-password", "reset-password", "verify-email"] as const;

export async function generateMetadata({ params }: { params: Promise<{ mode: string }> }): Promise<Metadata> {
  const { mode } = await params;
  const titles: Record<string, string> = {
    "sign-in": "Sign in",
    "sign-up": "Create account",
    "forgot-password": "Forgot password",
    "reset-password": "Reset password",
    "verify-email": "Verify email",
  };
  return { title: titles[mode] || "Account access" };
}

export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!modes.includes(mode as AuthMode)) notFound();
  return <AuthForm mode={mode as AuthMode} />;
}
