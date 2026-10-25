import { notFound } from "next/navigation";
import { StorefrontHome } from "@/features/storefront/components/storefront-home";
import type { StorefrontLocale } from "@/features/storefront/types";

function storefrontLocale(locale: string): StorefrontLocale {
  if (locale !== "es-GT" && locale !== "en-US") notFound();
  return locale;
}

export default async function StorefrontPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return <StorefrontHome locale={storefrontLocale(locale)} />;
}
