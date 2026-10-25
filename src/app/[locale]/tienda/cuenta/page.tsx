import { notFound } from "next/navigation";
import { StorefrontAccountScreen } from "@/features/storefront/components/storefront-account-screen";
import type { StorefrontLocale } from "@/features/storefront/types";

export default async function StorefrontAccountPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (locale !== "es-GT" && locale !== "en-US") notFound();
  return <StorefrontAccountScreen locale={locale as StorefrontLocale} />;
}
