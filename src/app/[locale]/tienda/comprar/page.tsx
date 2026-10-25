import { notFound } from "next/navigation";
import { StorefrontShopScreen } from "@/features/storefront/components/storefront-shop-screen";
import type { StorefrontLocale } from "@/features/storefront/types";

export default async function StorefrontShopPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (locale !== "es-GT" && locale !== "en-US") notFound();
  return <StorefrontShopScreen locale={locale as StorefrontLocale} />;
}
