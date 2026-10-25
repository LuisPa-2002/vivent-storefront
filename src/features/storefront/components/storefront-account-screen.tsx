"use client";

import { MapPin, PackageCheck, Plus, Search, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStorefrontAddress, getStorefrontMe, listStorefrontAddresses, listStorefrontOrders, searchStorefrontPlaces } from "@/features/storefront/api";
import { GoogleMapPinPicker } from "@/features/storefront/components/google-map-pin-picker";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import { getStorefrontSession, setStorefrontSession } from "@/features/storefront/session";
import type { StorefrontLocale } from "@/features/storefront/types";
import { ApiError } from "@/lib/api/errors";

type PhotonFeature = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export function StorefrontAccountScreen({ locale }: Readonly<{ locale: StorefrontLocale }>) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const queryClient = useQueryClient();
  const base = `/${locale}/tienda`;
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [form, setForm] = useState({ label: "Casa", formattedAddress: "", latitude: "14.6008", longitude: "-90.5165", isDefault: true });

  useEffect(() => {
    if (!hydrated) return;
    if (!getStorefrontSession()?.sessionToken) {
      router.replace(`${base}/login`);
    }
  }, [base, hydrated, router]);

  useEffect(() => {
    if (search.trim().length < 3) {
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      try {
        const payload = await searchStorefrontPlaces(search.trim(), locale);
        if (!controller.signal.aborted) setResults(payload);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      }
    }, 800);
    return () => { window.clearTimeout(handle); controller.abort(); };
  }, [locale, search]);

  const authenticated = hydrated && Boolean(getStorefrontSession()?.sessionToken);
  const me = useQuery({ queryKey: ["storefront", "me"], queryFn: getStorefrontMe, enabled: authenticated });
  const addresses = useQuery({ queryKey: ["storefront", "addresses"], queryFn: listStorefrontAddresses, enabled: authenticated });
  const orders = useQuery({ queryKey: ["storefront", "orders"], queryFn: listStorefrontOrders, enabled: authenticated });
  useEffect(() => { if (me.data) setStorefrontSession(me.data); }, [me.data]);

  const createAddress = useMutation({
    mutationFn: () => createStorefrontAddress({
      label: form.label,
      formattedAddress: form.formattedAddress,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      isDefault: form.isDefault,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront", "addresses"] });
      setShowAddressForm(false);
      setSearch("");
    },
  });

  const choosePhoton = (feature: PhotonFeature) => {
    setForm({ ...form, formattedAddress: feature.displayName, longitude: String(feature.longitude), latitude: String(feature.latitude) });
    setSearch(feature.displayName);
    setResults([]);
  };

  const addressError = createAddress.error instanceof ApiError && createAddress.error.errorCode === "DUPLICATE_ADDRESS_LABEL"
    ? t("account.addressLabelAlreadyExists")
    : createAddress.error?.message;

  if (!hydrated || !authenticated) return null;

  return (
    <StorefrontShell locale={locale}>
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="rounded-[2.2rem] bg-[#17382b] p-8 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#f5b05f]">{me.data?.email}</p><h1 className="mt-3 text-4xl font-black tracking-[-.055em]">{t("account.title")}</h1><p className="mt-3 text-white/65">{t("account.description")}</p></div>
            <div className="grid size-20 place-items-center rounded-full bg-white/10"><UserRound className="size-9" /></div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-[#17382b]/10 bg-white p-6 shadow-[0_18px_60px_rgba(23,56,43,.07)] sm:p-8">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#d96f32]">{t("account.addresses")}</p><h2 className="mt-1 text-2xl font-black">{t("account.addresses")}</h2></div><Button size="sm" onClick={() => setShowAddressForm((value) => !value)}><Plus className="mr-1 size-4" />{t("account.newAddress")}</Button></div>
            {showAddressForm ? (
              <form className="mt-7 grid gap-4 rounded-2xl bg-[#f7f3ea] p-5" onSubmit={(event) => { event.preventDefault(); createAddress.mutate(); }}>
                <div className="space-y-2"><Label>{t("account.label")}</Label><Input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} /></div>
                <div className="relative space-y-2"><Label><Search className="mr-1 inline size-4" />Photon</Label><Input value={search} placeholder="Zona 10, Guatemala" onChange={(event) => setSearch(event.target.value)} />{search.trim().length >= 3 && results.length ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl">{results.map((result, index) => <button key={`${result.longitude}-${result.latitude}-${index}`} type="button" className="block w-full border-b px-4 py-3 text-left text-sm hover:bg-[#f7f3ea]" onClick={() => choosePhoton(result)}>{result.displayName}</button>)}</div> : null}<p className="text-[10px] text-[#7a897f]">© OpenStreetMap contributors · Photon</p></div>
                <div className="space-y-2"><Label>{t("account.formattedAddress")}</Label><Input required value={form.formattedAddress} onChange={(event) => setForm({ ...form, formattedAddress: event.target.value })} /></div>
                <GoogleMapPinPicker
                  latitude={Number(form.latitude)}
                  longitude={Number(form.longitude)}
                  onChange={({ latitude, longitude }) => setForm((current) => ({ ...current, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }))}
                  labels={{
                    loading: t("account.mapLoading"),
                    unavailable: t("account.mapUnavailable"),
                    loadError: t("account.mapLoadError"),
                    instructions: t("account.mapInstructions"),
                    map: t("account.mapLabel"),
                  }}
                />
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>{t("account.latitude")}</Label><Input required inputMode="decimal" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></div><div className="space-y-2"><Label>{t("account.longitude")}</Label><Input required inputMode="decimal" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></div></div>
                <button type="button" className="text-left text-xs font-black text-[#176a48]" onClick={() => setForm({ ...form, formattedAddress: "Zona 10, Ciudad de Guatemala", latitude: "14.6008", longitude: "-90.5165" })}>{t("account.demoPin")}</button>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />{t("account.default")}</label>
                {addressError ? <p className="text-sm text-red-700">{addressError}</p> : null}
                <Button disabled={createAddress.isPending} type="submit">{t("account.save")}</Button>
              </form>
            ) : null}
            <div className="mt-6 space-y-3">{(addresses.data ?? []).map((address) => <div key={address.id} className="flex gap-4 rounded-2xl border border-[#17382b]/10 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5f2e9] text-[#176a48]"><MapPin className="size-5" /></div><div><div className="flex items-center gap-2"><p className="font-black">{address.label}</p>{address.isDefault ? <span className="rounded-full bg-[#f3e6d5] px-2 py-1 text-[9px] font-black uppercase">Default</span> : null}</div><p className="mt-1 text-sm leading-5 text-[#66776c]">{address.formattedAddress}</p></div></div>)}{!addresses.isLoading && addresses.data?.length === 0 ? <p className="text-sm text-[#66776c]">{t("account.noAddresses")}</p> : null}</div>
          </section>

          <section className="rounded-[2rem] border border-[#17382b]/10 bg-white p-6 shadow-[0_18px_60px_rgba(23,56,43,.07)] sm:p-8">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#d96f32]">{t("account.orders")}</p><h2 className="mt-1 text-2xl font-black">{t("account.orders")}</h2></div>
            <div className="mt-6 space-y-4">{(orders.data?.items ?? []).map((order) => <article key={order.id} className="rounded-2xl border border-[#17382b]/10 p-5"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#f3e6d5] text-[#d96f32]"><PackageCheck className="size-5" /></div><div><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-xs text-[#7a897f]">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(order.createdAt))}</p></div></div><span className="rounded-full bg-[#e5f2e9] px-3 py-1 text-[10px] font-black uppercase text-[#176a48]">{order.status}</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#17382b]/10 pt-4 text-sm"><div><p className="text-xs text-[#7a897f]">{t("account.fulfillment")}</p><p className="font-bold">{order.fulfillmentMode}</p></div><div className="text-right"><p className="text-xs text-[#7a897f]">{t("account.total")}</p><p className="text-lg font-black">Q{Number(order.totalAmount).toFixed(2)}</p></div></div></article>)}{!orders.isLoading && orders.data?.items.length === 0 ? <p className="text-sm text-[#66776c]">{t("account.noOrders")}</p> : null}</div>
          </section>
        </div>
      </section>
    </StorefrontShell>
  );
}
