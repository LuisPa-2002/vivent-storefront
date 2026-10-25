import { notFound } from "next/navigation";
import { StorefrontAuthScreen } from "@/features/storefront/components/storefront-auth-screen";
import type { StorefrontLocale } from "@/features/storefront/types";

export default async function StorefrontLoginPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (locale !== "es-GT" && locale !== "en-US") notFound();
  return <StorefrontAuthScreen locale={locale as StorefrontLocale} mode="login" />;
}
