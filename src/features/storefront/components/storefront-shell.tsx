"use client";

import Link from "next/link";
import { LogIn, MapPin, Menu, PackageCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/components/providers/locale-provider";
import { getTenantConfig } from "@/features/tenant/lib/get-tenant-config";
import { resolveTenantSlug } from "@/features/tenant/lib/resolve-tenant";
import { clearStorefrontSession, hasStorefrontSession, subscribeToStorefrontStorage } from "@/features/storefront/session";
import { logoutStorefront } from "@/features/storefront/api";
import type { StorefrontLocale } from "@/features/storefront/types";

export function StorefrontShell({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: StorefrontLocale }>) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setLocale, setTimeZone } = useAppLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const authenticated = useSyncExternalStore(subscribeToStorefrontStorage, hasStorefrontSession, () => false);
  const tenantSlug = typeof window === "undefined" ? "demo" : resolveTenantSlug(window.location.hostname);
  const tenantQuery = useQuery({ queryKey: ["storefront", "tenant", tenantSlug], queryFn: () => getTenantConfig(tenantSlug) });

  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);

  useEffect(() => {
    if (tenantQuery.data?.timezone) setTimeZone(tenantQuery.data.timezone);
  }, [setTimeZone, tenantQuery.data?.timezone]);

  const base = `/${locale}/tienda`;
  const logout = async () => {
    try {
      await logoutStorefront();
    } catch {
      // Local session is always cleared, even if the backend is unavailable.
    }
    clearStorefrontSession();
    queryClient.clear();
    router.push(base);
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17382b]" style={{ "--store-brand": tenantQuery.data?.primaryColor ?? "#176a48" } as React.CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-[#17382b]/10 bg-[#f7f3ea]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href={base} className="flex items-center gap-3" aria-label={tenantQuery.data?.commercialName ?? "Demo Vivent GT"}>
            <span className="grid size-11 place-items-center rounded-[1.15rem] bg-[#176a48] text-lg font-black text-white shadow-[0_10px_30px_rgba(23,106,72,.22)]">V</span>
            <span>
              <span className="block text-lg font-black tracking-[-0.04em]">{tenantQuery.data?.commercialName ?? "Demo Vivent GT"}</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#6d7c72]">{t("brandTagline")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold lg:flex">
            <Link className="transition hover:text-[#d96f32]" href={base}>{t("nav.home")}</Link>
            <Link className="transition hover:text-[#d96f32]" href={`${base}/comprar`}>{t("nav.shop")}</Link>
            {authenticated ? <Link className="transition hover:text-[#d96f32]" href={`${base}/cuenta`}>{t("nav.account")}</Link> : null}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href={`/${locale === "es-GT" ? "en-US" : "es-GT"}/tienda`} className="rounded-full px-3 py-2 text-xs font-black text-[#6d7c72] hover:bg-white">
              {locale === "es-GT" ? "EN" : "ES"}
            </Link>
            {authenticated ? (
              <>
                <Link href={`${base}/cuenta`}><Button variant="outline"><UserRound className="mr-2 size-4" />{t("nav.account")}</Button></Link>
                <Button onClick={logout}>{t("nav.logout")}</Button>
              </>
            ) : (
              <Link href={`${base}/login`}><Button><LogIn className="mr-2 size-4" />{t("nav.login")}</Button></Link>
            )}
          </div>

          <button className="grid size-11 place-items-center rounded-xl border bg-white lg:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t bg-[#f7f3ea] px-5 py-4 lg:hidden">
            <div className="grid gap-2 font-bold">
              <Link className="rounded-xl px-4 py-3 hover:bg-white" href={base}>{t("nav.home")}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white" href={`${base}/comprar`}>{t("nav.shop")}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white" href={authenticated ? `${base}/cuenta` : `${base}/login`}>{authenticated ? t("nav.account") : t("nav.login")}</Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="mt-20 bg-[#17382b] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3"><ShoppingBag className="size-6 text-[#f5b05f]" /><span className="text-xl font-black">{tenantQuery.data?.commercialName ?? "Demo Vivent GT"}</span></div>
            <p className="max-w-xl text-sm leading-6 text-white/65">{t("footer.demo")}. {t("footer.legal")}</p>
          </div>
          <div className="flex gap-4 text-xs font-bold text-white/70">
            <span className="flex items-center gap-1"><MapPin className="size-4" />Guatemala</span>
            <span className="flex items-center gap-1"><PackageCheck className="size-4" />Vivent</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
