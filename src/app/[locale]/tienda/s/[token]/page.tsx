import { notFound } from "next/navigation";
import { ConversationCatalogScreen } from "@/features/storefront/components/conversation-catalog-screen";

export default async function ConversationCatalogPage({ params }: Readonly<{ params: Promise<{ locale: string; token: string }> }>) {
  const { locale, token } = await params;
  if (locale !== "es-GT" && locale !== "en-US") notFound();
  return <ConversationCatalogScreen token={token} />;
}
