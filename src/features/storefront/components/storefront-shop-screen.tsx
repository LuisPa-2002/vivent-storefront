"use client";

import Link from "next/link";
import { ArrowLeft, Check, MapPin, Minus, PackageCheck, Plus, Search, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkoutStorefrontCart,
  createStorefrontAddress,
  createStorefrontCart,
  getStorefrontCart,
  getTransactionalCatalog,
  listStorefrontBankAccounts,
  listStorefrontAddresses,
  listStorefrontPickupBranches,
  removeStorefrontCartItem,
  searchStorefrontPlaces,
  submitStorefrontTransfer,
  upsertStorefrontCartItem,
  uploadStorefrontPrivateImage,
} from "@/features/storefront/api";
import { ProductArt } from "@/features/storefront/components/product-art";
import { GoogleMapPinPicker } from "@/features/storefront/components/google-map-pin-picker";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import {
  clearStorefrontCartSelection,
  getStorefrontCartSelection,
  getStorefrontSession,
  setStorefrontCartSelection,
} from "@/features/storefront/session";
import type { StorefrontCartSelection, StorefrontLocale, StorefrontOrder } from "@/features/storefront/types";
import { ApiError } from "@/lib/api/errors";

type PhotonFeature = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export function StorefrontShopScreen({ locale }: Readonly<{ locale: StorefrontLocale }>) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const queryClient = useQueryClient();
  const base = `/${locale}/tienda`;
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const storedSelection = hydrated ? getStorefrontCartSelection() : null;
  const [mode, setMode] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [addressId, setAddressId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [placeResults, setPlaceResults] = useState<PhotonFeature[]>([]);
  const [addressForm, setAddressForm] = useState({
    label: "Casa",
    formattedAddress: "",
    latitude: "14.6008",
    longitude: "-90.5165",
    isDefault: true,
  });
  const [selectionOverride, setSelection] = useState<StorefrontCartSelection | null>(null);
  const selection = selectionOverride ?? storedSelection;
  const [order, setOrder] = useState<StorefrontOrder | null>(null);
  const [billingName, setBillingName] = useState("Cliente Demo");
  const [taxId, setTaxId] = useState("CF");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_FULFILLMENT" | "BANK_TRANSFER">("CASH_ON_FULFILLMENT");
  const [bankAccountId, setBankAccountId] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [reference, setReference] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!getStorefrontSession()?.sessionToken) {
      router.replace(`${base}/login`);
    }
  }, [base, hydrated, router]);

  useEffect(() => {
    if (addressSearch.trim().length < 3) {
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      try {
        const results = await searchStorefrontPlaces(addressSearch.trim(), locale);
        if (!controller.signal.aborted) setPlaceResults(results);
      } catch {
        if (!controller.signal.aborted) setPlaceResults([]);
      }
    }, 800);
    return () => { window.clearTimeout(handle); controller.abort(); };
  }, [addressSearch, locale]);

  const authenticated = hydrated && Boolean(getStorefrontSession()?.sessionToken);
  const addresses = useQuery({ queryKey: ["storefront", "addresses"], queryFn: listStorefrontAddresses, enabled: authenticated });
  const branches = useQuery({ queryKey: ["storefront", "pickup-branches"], queryFn: listStorefrontPickupBranches, enabled: authenticated });
  const cart = useQuery({ queryKey: ["storefront", "cart", selection?.cartId], queryFn: () => getStorefrontCart(selection!.cartId), enabled: Boolean(selection?.cartId) });
  const catalog = useQuery({ queryKey: ["storefront", "catalog", selection?.cartId], queryFn: () => getTransactionalCatalog(selection!.cartId), enabled: Boolean(selection?.cartId) });
  const bankAccounts = useQuery({ queryKey: ["storefront", "bank-accounts", selection?.cartId], queryFn: () => listStorefrontBankAccounts(selection!.cartId), enabled: Boolean(selection?.cartId) });

  const effectiveAddressId = addressId || addresses.data?.find((item) => item.isDefault)?.id || addresses.data?.[0]?.id || "";
  const effectiveBranchId = branchId || branches.data?.[0]?.branchId || "";

  const createCart = useMutation({
    mutationFn: () => createStorefrontCart({
      fulfillmentMode: mode,
      addressId: mode === "DELIVERY" ? effectiveAddressId : null,
      branchId: mode === "PICKUP" ? effectiveBranchId : null,
    }),
    onSuccess: (created) => {
      const next = { cartId: created.id, fulfillmentMode: mode, addressId: mode === "DELIVERY" ? effectiveAddressId : null, branchId: created.branchId } satisfies StorefrontCartSelection;
      setStorefrontCartSelection(next);
      setSelection(next);
    },
  });
  const createAddress = useMutation({
    mutationFn: () => createStorefrontAddress({
      label: addressForm.label,
      formattedAddress: addressForm.formattedAddress,
      latitude: Number(addressForm.latitude),
      longitude: Number(addressForm.longitude),
      isDefault: addressForm.isDefault,
    }),
    onSuccess: (created) => {
      queryClient.setQueryData(["storefront", "addresses"], (current: typeof addresses.data) => {
        const withoutPreviousDefault = addressForm.isDefault ? (current ?? []).map((address) => ({ ...address, isDefault: false })) : (current ?? []);
        return [...withoutPreviousDefault, created];
      });
      setAddressId(created.id);
      setShowAddressForm(false);
      setAddressSearch("");
      setPlaceResults([]);
    },
  });

  const itemMutation = useMutation({
    mutationFn: ({ offerId, type, quantity }: { offerId: string; type: "PRODUCT" | "COMBO"; quantity: number }) =>
      upsertStorefrontCartItem(selection!.cartId, { offerId, type, quantity }),
    onSuccess: (updated) => queryClient.setQueryData(["storefront", "cart", selection?.cartId], updated),
  });
  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeStorefrontCartItem(selection!.cartId, itemId),
    onSuccess: (updated) => queryClient.setQueryData(["storefront", "cart", selection?.cartId], updated),
  });
  const checkout = useMutation({
    mutationFn: () => {
      const selectedAddress = addresses.data?.find((item) => item.id === selection?.addressId);
      return checkoutStorefrontCart(selection!.cartId, {
        fulfillmentMode: selection!.fulfillmentMode,
        latitude: selection!.fulfillmentMode === "DELIVERY" ? selectedAddress?.latitude ?? null : null,
        longitude: selection!.fulfillmentMode === "DELIVERY" ? selectedAddress?.longitude ?? null : null,
        formattedAddress: selection!.fulfillmentMode === "DELIVERY" ? selectedAddress?.formattedAddress ?? null : null,
        fulfillmentDate: null,
        billingTaxId: taxId,
        billingName,
        deliveryInstructions: instructions || null,
        paymentMethod,
        cashTenderedAmount: null,
      });
    },
    onSuccess: (created) => {
      setOrder(created);
      if (created.paymentMethod === "CASH_ON_FULFILLMENT") {
        clearStorefrontCartSelection();
        setSelection(null);
        queryClient.removeQueries({ queryKey: ["storefront", "cart"] });
      }
    },
  });
  const transfer = useMutation({
    mutationFn: async () => {
      if (!order || !evidence) throw new Error("Selecciona un comprobante JPEG o PNG.");
      const media = await uploadStorefrontPrivateImage(evidence);
      return submitStorefrontTransfer(order.id, {
        bankAccountId: bankAccountId || bankAccounts.data?.[0]?.id || "",
        senderBank,
        reference,
        transferDate,
        amount: Number(order.totalAmount),
        evidenceMediaId: media.id,
      });
    },
    onSuccess: () => {
      clearStorefrontCartSelection();
      setSelection(null);
      queryClient.removeQueries({ queryKey: ["storefront", "cart"] });
      setOrder((current) => current ? { ...current, status: "PENDING_VERIFICATION" } : current);
    },
  });

  const subtotal = useMemo(() => (cart.data?.items ?? []).reduce((sum, item) => sum + Number(item.lineTotal), 0), [cart.data?.items]);
  const resetLocation = () => {
    clearStorefrontCartSelection();
    setSelection(null);
    setOrder(null);
  };
  const choosePlace = (place: PhotonFeature) => {
    setAddressForm((current) => ({
      ...current,
      formattedAddress: place.displayName,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
    }));
    setAddressSearch(place.displayName);
    setPlaceResults([]);
  };
  const addressError = createAddress.error instanceof ApiError && createAddress.error.errorCode === "DUPLICATE_ADDRESS_LABEL"
    ? t("account.addressLabelAlreadyExists")
    : createAddress.error?.message;

  if (!hydrated || !authenticated) return null;

  return (
    <StorefrontShell locale={locale}>
      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-[10px] font-black uppercase tracking-[.24em] text-[#9a6849]">Demo apparel store</p><h1 className="mt-1 text-3xl font-black tracking-[-.06em] sm:text-4xl">{t("shop.title")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66776c]">{t("shop.description")}</p></div>
          {selection ? <Button variant="outline" onClick={resetLocation}><ArrowLeft className="mr-2 size-4" />{t("shop.changeLocation")}</Button> : null}
        </div>

        {order ? (
          <div className="mx-auto max-w-2xl rounded-[2.5rem] bg-[#17382b] p-8 text-white shadow-2xl sm:p-12">
            <div className="grid size-16 place-items-center rounded-full bg-[#8cc7a8] text-[#17382b]"><Check className="size-8" /></div>
            <h2 className="mt-7 text-4xl font-black tracking-[-.05em]">{t("shop.orderCreated")}</h2>
            <div className="mt-8 grid gap-4 rounded-2xl bg-white/10 p-6 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-white/55">{t("shop.orderNumber")}</p><p className="mt-1 text-xl font-black">{order.orderNumber}</p></div>{order.pickupCode ? <div><p className="text-xs uppercase tracking-wider text-white/55">{t("shop.pickupCode")}</p><p className="mt-1 text-xl font-black text-[#f5b05f]">{order.pickupCode}</p></div> : null}</div>
            {order.paymentMethod === "BANK_TRANSFER" && order.status !== "PENDING_VERIFICATION" ? <div className="mt-6 grid gap-4 rounded-2xl bg-white/10 p-6"><p className="font-black">Reportar transferencia · Q{Number(order.totalAmount).toFixed(2)}</p><select className="h-11 rounded-xl bg-white px-3 text-[#17382b]" value={bankAccountId || bankAccounts.data?.[0]?.id || ""} onChange={(event) => setBankAccountId(event.target.value)}>{(bankAccounts.data ?? []).map((account) => <option key={account.id} value={account.id}>{account.bankName} · {account.maskedAccountNumber}</option>)}</select><Input className="bg-white text-[#17382b]" placeholder="Banco emisor" value={senderBank} onChange={(event) => setSenderBank(event.target.value)} /><Input className="bg-white text-[#17382b]" placeholder="Referencia" value={reference} onChange={(event) => setReference(event.target.value)} /><Input className="bg-white text-[#17382b]" type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} /><Input className="bg-white text-[#17382b]" type="file" accept="image/jpeg,image/png" onChange={(event) => setEvidence(event.target.files?.[0] ?? null)} />{transfer.error ? <p className="text-sm text-red-200">{transfer.error.message}</p> : null}<Button className="bg-[#f5b05f] text-[#17382b]" disabled={transfer.isPending || !senderBank || !reference || !transferDate || !evidence || !(bankAccountId || bankAccounts.data?.[0]?.id)} onClick={() => transfer.mutate()}>Enviar comprobante</Button></div> : null}
            {order.paymentMethod === "BANK_TRANSFER" && order.status === "PENDING_VERIFICATION" ? <p className="mt-6 rounded-2xl bg-white/10 p-5 font-bold">Comprobante recibido. La transferencia está pendiente de verificación.</p> : null}
            <Link href={`${base}/cuenta`}><Button className="mt-7 h-12 rounded-full bg-[#f5b05f] text-[#17382b] hover:bg-[#f3a64a]">{t("shop.goOrders")}</Button></Link>
          </div>
        ) : !selection ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[1.6rem] border border-[#203229]/10 bg-white p-5 shadow-[0_16px_45px_rgba(23,56,43,.07)] sm:p-6">
              <div className="grid grid-cols-2 gap-2.5">
                <ModeButton active={mode === "DELIVERY"} icon={Truck} label={t("shop.delivery")} onClick={() => setMode("DELIVERY")} />
                <ModeButton active={mode === "PICKUP"} icon={Store} label={t("shop.pickup")} onClick={() => setMode("PICKUP")} />
              </div>
              <div className="mt-5 space-y-2">
                <Label>{mode === "DELIVERY" ? t("shop.address") : t("shop.branch")}</Label>
                <select className="h-12 w-full rounded-xl border bg-[#f7f3ea] px-4" value={mode === "DELIVERY" ? effectiveAddressId : effectiveBranchId} onChange={(event) => mode === "DELIVERY" ? setAddressId(event.target.value) : setBranchId(event.target.value)}>
                  <option value="">—</option>
                  {mode === "DELIVERY" ? (addresses.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.formattedAddress}</option>) : (branches.data ?? []).map((item) => <option key={item.branchId} value={item.branchId}>{item.branchName} · {item.address}</option>)}
                </select>
              </div>
               {mode === "DELIVERY" ? (
                 <div className="mt-3">
                    <button type="button" className="inline-flex items-center text-sm font-bold text-[#176a48]" onClick={() => setShowAddressForm((current) => !current)}><Plus className="mr-1 size-4" />{t("shop.addNewAddress")}</button>
                    {showAddressForm ? (
                      <form className="mt-3 grid gap-3 rounded-2xl border border-[#176a48]/15 bg-[#f8f6f0] p-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); createAddress.mutate(); }}>
                        <div className="space-y-1.5"><Label>{t("account.label")}</Label><Input required className="h-10 bg-white" value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} /></div>
                        <div className="relative space-y-1.5"><Label><Search className="mr-1 inline size-3.5" />{t("shop.addressSearch")}</Label><Input className="h-10 bg-white" value={addressSearch} placeholder="Zona 10, Guatemala" onChange={(event) => setAddressSearch(event.target.value)} />{addressSearch.trim().length >= 3 && placeResults.length ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl">{placeResults.map((place, index) => <button key={`${place.longitude}-${place.latitude}-${index}`} type="button" className="block w-full border-b px-3 py-2 text-left text-xs hover:bg-[#f8f6f0]" onClick={() => choosePlace(place)}>{place.displayName}</button>)}</div> : null}</div>
                        <div className="space-y-1.5 sm:col-span-2"><Label>{t("account.formattedAddress")}</Label><Input required className="h-10 bg-white" value={addressForm.formattedAddress} onChange={(event) => setAddressForm((current) => ({ ...current, formattedAddress: event.target.value }))} /><p className="pt-1 text-[10px] text-[#7a897f]">© OpenStreetMap contributors · Photon</p></div>
                        <div className="sm:col-span-2"><GoogleMapPinPicker compact latitude={Number(addressForm.latitude)} longitude={Number(addressForm.longitude)} onChange={({ latitude, longitude }) => setAddressForm((current) => ({ ...current, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }))} labels={{ loading: t("account.mapLoading"), unavailable: t("account.mapUnavailable"), loadError: t("account.mapLoadError"), instructions: t("account.mapInstructions"), map: t("account.mapLabel") }} /></div>
                        <details className="sm:col-span-2"><summary className="cursor-pointer text-xs font-bold text-[#176a48]">{t("account.latitude")} / {t("account.longitude")}</summary><div className="mt-2 grid grid-cols-2 gap-3"><Input required inputMode="decimal" value={addressForm.latitude} onChange={(event) => setAddressForm((current) => ({ ...current, latitude: event.target.value }))} /><Input required inputMode="decimal" value={addressForm.longitude} onChange={(event) => setAddressForm((current) => ({ ...current, longitude: event.target.value }))} /></div></details>
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} />{t("account.default")}</label><button type="button" className="text-xs font-black text-[#176a48]" onClick={() => setAddressForm((current) => ({ ...current, formattedAddress: "Zona 10, Ciudad de Guatemala", latitude: "14.6008", longitude: "-90.5165" }))}>{t("account.demoPin")}</button></div>
                        {addressError ? <p className="text-sm text-red-700">{addressError}</p> : null}
                        <div className="flex flex-wrap gap-3 sm:col-span-2"><Button type="submit" className="h-10 rounded-full" disabled={createAddress.isPending}>{t("shop.saveAndUseAddress")}</Button><Button type="button" variant="outline" className="h-10 rounded-full" onClick={() => setShowAddressForm(false)}>{t("shop.cancel")}</Button></div>
                      </form>
                   ) : null}
                 </div>
               ) : null}
              {createCart.error ? <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{createCart.error.message}</p> : null}
               <Button className="mt-5 h-11 w-full rounded-full bg-[#176a48]" disabled={createCart.isPending || (mode === "DELIVERY" ? !effectiveAddressId : !effectiveBranchId)} onClick={() => createCart.mutate()}>{t("shop.continue")}</Button>
             </div>
             <div className="rounded-[1.6rem] bg-[#e8dfd2] p-6 lg:self-start"><MapPin className="size-7 text-[#9a6849]" /><h2 className="mt-4 text-xl font-black">{mode === "DELIVERY" ? t("benefits.delivery") : t("benefits.pickup")}</h2><p className="mt-2 text-sm leading-6 text-[#66776c]">{mode === "DELIVERY" ? t("benefits.deliveryText") : t("benefits.pickupText")}</p></div>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            <div>
              {catalog.isLoading ? <p>{t("common.loading")}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(catalog.data ?? []).map((offer) => {
                  const existing = cart.data?.items.find((item) => item.offerId === offer.offerId);
                   return <article key={offer.offerId} className="overflow-hidden rounded-[1.35rem] border border-[#203229]/10 bg-white shadow-[0_12px_35px_rgba(23,56,43,.06)]"><ProductArt compact title={offer.title} imageUrl={offer.images[0]?.url} /><div className="p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="text-lg font-black tracking-[-.04em]">{offer.title}</h2><p className="mt-0.5 text-xs font-bold text-[#7a897f]">{offer.presentationName}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${offer.availability === "AVAILABLE" ? "bg-[#e5f2e9] text-[#176a48]" : "bg-red-50 text-red-700"}`}>{offer.availability === "AVAILABLE" ? t("catalog.available") : t("catalog.soldOut")}</span></div><p className="mt-3 text-xl font-black">Q{Number(offer.unitPrice).toFixed(2)}</p>{existing ? <div className="mt-3 flex items-center justify-between rounded-full bg-[#f7f3ea] p-1"><button className="grid size-8 place-items-center rounded-full bg-white" onClick={() => existing.quantity <= 1 ? removeMutation.mutate(existing.id) : itemMutation.mutate({ offerId: offer.offerId, type: offer.itemType, quantity: existing.quantity - 1 })}><Minus className="size-3.5" /></button><span className="text-sm font-black">{existing.quantity}</span><button className="grid size-8 place-items-center rounded-full bg-[#176a48] text-white" onClick={() => itemMutation.mutate({ offerId: offer.offerId, type: offer.itemType, quantity: existing.quantity + 1 })}><Plus className="size-3.5" /></button></div> : <Button className="mt-3 h-9 w-full rounded-full bg-[#176a48] text-xs" disabled={offer.availability !== "AVAILABLE"} onClick={() => itemMutation.mutate({ offerId: offer.offerId, type: offer.itemType, quantity: 1 })}>{t("shop.add")}<Plus className="ml-1.5 size-3.5" /></Button>}</div></article>;
                })}
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] border border-[#17382b]/10 bg-white p-6 shadow-[0_20px_70px_rgba(23,56,43,.1)] xl:sticky xl:top-28">
              <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#e5f2e9] text-[#176a48]"><ShoppingCart className="size-5" /></div><div><h2 className="text-xl font-black">{t("shop.cart")}</h2><p className="text-xs text-[#7a897f]">{cart.data?.items.length ?? 0} productos</p></div></div>
              <div className="my-6 space-y-4">
                {(cart.data?.items ?? []).map((item) => <div key={item.id} className="flex items-start justify-between gap-3 border-b border-[#17382b]/10 pb-4"><div><p className="font-bold">{item.name}</p><p className="text-xs text-[#7a897f]">{item.quantity} × Q{Number(item.unitPrice).toFixed(2)}</p></div><button className="text-[#b9503f]" onClick={() => removeMutation.mutate(item.id)}><Trash2 className="size-4" /></button></div>)}
                {(cart.data?.items.length ?? 0) === 0 ? <p className="rounded-xl bg-[#f7f3ea] p-4 text-sm text-[#66776c]">{t("shop.emptyCart")}</p> : null}
              </div>
              <div className="flex justify-between border-y border-[#17382b]/10 py-4 text-lg font-black"><span>{t("shop.subtotal")}</span><span>Q{subtotal.toFixed(2)}</span></div>
               {(cart.data?.items.length ?? 0) > 0 ? <div className="mt-6 grid gap-4"><div className="space-y-2"><Label>{t("shop.billingName")}</Label><Input value={billingName} onChange={(event) => setBillingName(event.target.value)} /></div><div className="space-y-2"><Label>{t("shop.taxId")}</Label><Input value={taxId} onChange={(event) => setTaxId(event.target.value)} /></div>{selection.fulfillmentMode === "DELIVERY" ? <div className="space-y-2"><Label>{t("shop.instructions")}</Label><Input value={instructions} onChange={(event) => setInstructions(event.target.value)} /></div> : null}<div className="space-y-2"><Label>Método de pago</Label><select className="h-11 rounded-xl border bg-[#f3e6d5] px-3 font-bold" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "CASH_ON_FULFILLMENT" | "BANK_TRANSFER")}><option value="CASH_ON_FULFILLMENT">{t("shop.cash")}</option><option value="BANK_TRANSFER">Transferencia bancaria</option></select></div>{paymentMethod === "BANK_TRANSFER" && bankAccounts.data?.length === 0 ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">No hay cuentas bancarias activas para esta sucursal.</p> : null}{checkout.error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{checkout.error.message}</p> : null}<Button className="h-12 rounded-full bg-[#d96f32] hover:bg-[#bd5b25]" disabled={checkout.isPending || !billingName || !taxId || (paymentMethod === "BANK_TRANSFER" && bankAccounts.data?.length === 0)} onClick={() => checkout.mutate()}><PackageCheck className="mr-2 size-5" />{t("shop.checkout")}</Button></div> : null}
            </aside>
          </div>
        )}
      </section>
    </StorefrontShell>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: Readonly<{ active: boolean; icon: typeof Truck; label: string; onClick: () => void }>) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-3.5 text-left transition ${active ? "border-[#176a48] bg-[#e5f2e9] text-[#176a48]" : "border-[#17382b]/10 bg-[#f7f3ea] hover:bg-white"}`}><Icon className="size-5" /><span className="mt-2 block text-sm font-black">{label}</span></button>;
}
