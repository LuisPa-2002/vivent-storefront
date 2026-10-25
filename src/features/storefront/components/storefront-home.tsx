"use client";

import Link from "next/link";
import { ArrowRight, Bike, PackageCheck, Shirt, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPublicStorefrontCatalog } from "@/features/storefront/api";
import { ProductArt } from "@/features/storefront/components/product-art";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import type { StorefrontLocale } from "@/features/storefront/types";

export function StorefrontHome({ locale }: Readonly<{ locale: StorefrontLocale }>) {
  const t = useTranslations("storefront");
  const catalog = useQuery({ queryKey: ["storefront", "public-catalog"], queryFn: getPublicStorefrontCatalog });
  const base = `/${locale}/tienda`;

  return (
    <StorefrontShell locale={locale}>
      <section className="storefront-hero relative isolate overflow-hidden border-b border-[#202a25]/10 text-[#f8f6f0]">
        <div className="storefront-hero-orb storefront-hero-orb-one" />
        <div className="storefront-hero-orb storefront-hero-orb-two" />
        <div className="storefront-hero-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid min-h-[min(720px,calc(100svh-4rem))] max-w-7xl items-center gap-10 px-5 py-14 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div className="fade-up">
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#d9bf94] sm:text-xs">{t("hero.eyebrow")}</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[.88] tracking-[-0.075em] sm:text-6xl lg:text-7xl">{t("hero.title")}</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#d6d9d1] sm:text-lg sm:leading-8">{t("hero.description")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`${base}/comprar`}><Button className="h-11 rounded-full bg-[#f5eee2] px-6 text-[#1c2822] hover:bg-white">{t("hero.primary")}<ArrowRight className="ml-2 size-4" /></Button></Link>
              <a href="#catalogo"><Button variant="outline" className="h-11 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">{t("hero.secondary")}</Button></a>
            </div>
            <div className="mt-12 flex items-center gap-6 text-[11px] font-bold uppercase tracking-[.15em] text-[#c8ccc4]">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#d9bf94]" />{t("hero.meta")}</span>
              <span>{t("hero.location")}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <div className="storefront-lookbook relative aspect-[4/5] overflow-hidden rounded-[2.4rem] border border-white/20 bg-[#d8c4aa] p-5 shadow-[0_40px_100px_rgba(0,0,0,.35)] sm:p-7">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.2),transparent_35%,rgba(27,39,32,.22))]" />
              <div className="absolute -left-16 top-20 size-56 rounded-full border-[18px] border-[#e9ded0]/70" />
              <div className="absolute -right-20 bottom-8 size-72 rounded-full bg-[#425247]/75" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between"><span className="rounded-full border border-[#1c2822]/20 bg-[#f8f6f0]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-[#1c2822]">Edition 01</span><span className="text-3xl font-black tracking-[-.1em] text-[#1c2822]">/V</span></div>
                <div className="relative mx-auto grid size-44 place-items-center rounded-full border border-white/40 bg-[#f3eee6]/30 text-[#203229] shadow-[0_30px_60px_rgba(31,43,36,.18)] backdrop-blur-[2px] sm:size-52"><Shirt className="size-24 sm:size-28" strokeWidth={1} /></div>
                <div className="flex items-end justify-between text-[#1c2822]"><div><p className="text-[10px] font-black uppercase tracking-[.2em] opacity-65">Modern uniform</p><p className="mt-1 text-xl font-black tracking-[-.05em]">Quiet pieces.</p></div><span className="grid size-10 place-items-center rounded-full border border-[#1c2822]/20 bg-[#f8f6f0]/70"><ArrowRight className="size-4" /></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-14 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl"><p className="text-xs font-black uppercase tracking-[.24em] text-[#9a6849]">{t("catalog.eyebrow")}</p><h2 className="mt-3 text-4xl font-black tracking-[-.065em] sm:text-5xl">{t("catalog.title")}</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#66776c]">{t("catalog.description")}</p>
        </div>
        {catalog.isLoading ? <p>{t("common.loading")}</p> : null}
        {catalog.isError ? <p className="rounded-2xl bg-red-50 p-5 text-red-700">{t("common.error")}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(catalog.data ?? []).map((item) => (
            <article key={`${item.itemType}-${item.listingId}`} className="group overflow-hidden rounded-[1.4rem] border border-[#203229]/10 bg-white shadow-[0_12px_35px_rgba(23,56,43,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(23,56,43,.12)]">
              <ProductArt compact title={item.title} imageUrl={item.images[0]?.url} />
              <div className="p-4 sm:p-5"><h3 className="text-lg font-black tracking-[-.045em]">{item.title}</h3><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#66776c]">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-[#203229]/10 pt-3"><span className="text-[10px] font-bold text-[#8a968f]">{t("catalog.publicHint")}</span><Link aria-label={t("catalog.view")} href={`${base}/comprar`} className="grid size-8 shrink-0 place-items-center rounded-full bg-[#203229] text-white transition group-hover:translate-x-0.5"><ArrowRight className="size-4" /></Link></div></div>
            </article>
          ))}
        </div>
        {!catalog.isLoading && (catalog.data?.length ?? 0) === 0 ? <p>{t("catalog.empty")}</p> : null}
      </section>

      <section className="border-t border-[#203229]/10 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><h2 className="text-center text-3xl font-black tracking-[-.06em] sm:text-4xl">{t("benefits.title")}</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[[Bike, "benefits.delivery", "benefits.deliveryText"], [Store, "benefits.pickup", "benefits.pickupText"], [PackageCheck, "benefits.trace", "benefits.traceText"]].map(([Icon, title, text]) => { const FeatureIcon = Icon as typeof Bike; return <div key={String(title)} className="rounded-[1.4rem] border border-[#203229]/10 bg-[#f8f6f0] p-5"><FeatureIcon className="size-6 text-[#9a6849]" /><h3 className="mt-4 text-lg font-black">{t(String(title))}</h3><p className="mt-1 text-sm leading-6 text-[#66776c]">{t(String(text))}</p></div>; })}</div></div>
      </section>
    </StorefrontShell>
  );
}
