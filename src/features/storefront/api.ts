import { apiCommandRequest, apiMultipartRequest, apiRequest } from "@/lib/api/http";
import { resolveTenantSlug } from "@/features/tenant/lib/resolve-tenant";
import { getStorefrontSession } from "@/features/storefront/session";
import type {
  PublicCatalogItem,
  StorefrontAddress,
  StorefrontBankAccount,
  StorefrontBranch,
  StorefrontCart,
  StorefrontOffer,
  StorefrontOrder,
  StorefrontOrdersPage,
  StorefrontSession,
} from "@/features/storefront/types";

function storefrontHost() {
  if (process.env.NEXT_PUBLIC_STOREFRONT_HOST) return process.env.NEXT_PUBLIC_STOREFRONT_HOST;
  if (typeof window === "undefined") return "demo.corpoviva.com";
  const slug = resolveTenantSlug(window.location.hostname);
  return `${slug}.corpoviva.com`;
}

function storefrontHeaders(authenticated = false) {
  const headers = new Headers({ "X-Storefront-Host": storefrontHost() });
  if (authenticated) {
    const token = getStorefrontSession()?.sessionToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export function getPublicStorefrontCatalog() {
  return apiRequest<PublicCatalogItem[]>("/api/v1/public/storefront/catalog", { headers: storefrontHeaders() });
}

export function loginStorefront(email: string, password: string) {
  return apiRequest<StorefrontSession>("/api/v1/public/storefront/auth/login", {
    method: "POST",
    headers: storefrontHeaders(),
    body: { email, password },
  });
}

export function registerStorefront(payload: { email: string; password: string; firstName: string; lastName: string; phone: string }) {
  return apiRequest<StorefrontSession>("/api/v1/public/storefront/auth/register", {
    method: "POST",
    headers: storefrontHeaders(),
    body: payload,
  });
}

export function requestStorefrontPasswordReset(email: string) {
  return apiRequest<void>("/api/v1/public/storefront/auth/request-password-reset", {
    method: "POST",
    headers: storefrontHeaders(),
    body: { email },
  });
}

export function getStorefrontMe() {
  return apiRequest<StorefrontSession>("/api/v1/storefront/account/me", { authenticated: false, headers: storefrontHeaders(true) });
}

export function logoutStorefront() {
  return apiRequest<void>("/api/v1/storefront/account/logout", { method: "POST", headers: storefrontHeaders(true) });
}

export function listStorefrontAddresses() {
  return apiRequest<StorefrontAddress[]>("/api/v1/storefront/account/addresses", { headers: storefrontHeaders(true) });
}

export function createStorefrontAddress(payload: Omit<StorefrontAddress, "id" | "active">) {
  return apiRequest<StorefrontAddress>("/api/v1/storefront/account/addresses", {
    method: "POST",
    headers: storefrontHeaders(true),
    body: payload,
  });
}

export function listStorefrontPickupBranches() {
  return apiRequest<StorefrontBranch[]>("/api/v1/storefront/fulfillment/pickup-branches", { headers: storefrontHeaders(true) });
}

export function createStorefrontCart(payload: { fulfillmentMode: "DELIVERY" | "PICKUP"; addressId: string | null; branchId: string | null }) {
  return apiCommandRequest<StorefrontCart>("/api/v1/storefront/carts", {
    method: "POST",
    headers: storefrontHeaders(true),
    body: payload,
  });
}

export function getStorefrontCart(cartId: string) {
  return apiRequest<StorefrontCart>(`/api/v1/storefront/carts/${cartId}`, { headers: storefrontHeaders(true) });
}

export function getTransactionalCatalog(cartId: string) {
  return apiRequest<StorefrontOffer[]>(`/api/v1/storefront/catalog?cartId=${encodeURIComponent(cartId)}`, {
    headers: storefrontHeaders(true),
    cache: "no-store",
  });
}

export function upsertStorefrontCartItem(cartId: string, payload: { type: "PRODUCT" | "COMBO"; offerId: string; quantity: number }) {
  return apiCommandRequest<StorefrontCart>(`/api/v1/storefront/carts/${cartId}/items`, {
    method: "PUT",
    headers: storefrontHeaders(true),
    body: payload,
  });
}

export function removeStorefrontCartItem(cartId: string, itemId: string) {
  return apiCommandRequest<StorefrontCart>(`/api/v1/storefront/carts/${cartId}/items/${itemId}`, {
    method: "DELETE",
    headers: storefrontHeaders(true),
  });
}

export type ConversationCatalogSession = {
  conversationId: string;
  companyName: string;
  branchName: string;
  expiresAt: string;
  cart: Omit<StorefrontCart, "channel"> & { channel: "WHATSAPP" };
  offers: Array<Pick<StorefrontOffer,
    "itemType" | "offerId" | "title" | "description" | "presentationName" |
    "unitPrice" | "availability" | "maximumQuantity" | "images"
  >>;
};

export function getConversationCatalog(token: string) {
  return apiRequest<ConversationCatalogSession>(`/api/v1/public/conversation-catalog/${encodeURIComponent(token)}`, { cache: "no-store" });
}

export function upsertConversationCartItem(token: string, payload: { type: "PRODUCT" | "COMBO"; offerId: string; quantity: number }) {
  return apiCommandRequest<ConversationCatalogSession>(`/api/v1/public/conversation-catalog/${encodeURIComponent(token)}/items`, {
    method: "PUT",
    body: payload,
  });
}

export function removeConversationCartItem(token: string, itemId: string) {
  return apiCommandRequest<ConversationCatalogSession>(`/api/v1/public/conversation-catalog/${encodeURIComponent(token)}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function checkoutStorefrontCart(cartId: string, payload: {
  fulfillmentMode: "DELIVERY" | "PICKUP";
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
  fulfillmentDate: string | null;
  billingTaxId: string;
  billingName: string;
  deliveryInstructions: string | null;
  paymentMethod: "CASH_ON_FULFILLMENT" | "BANK_TRANSFER";
  cashTenderedAmount: number | null;
}) {
  return apiCommandRequest<StorefrontOrder>(`/api/v1/storefront/carts/${cartId}/checkout`, {
    method: "POST",
    headers: storefrontHeaders(true),
    body: payload,
  });
}

export function uploadStorefrontPrivateImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return apiMultipartRequest<{ id: string }>("/api/v1/storefront/media/private", formData, {
    headers: storefrontHeaders(true),
  });
}

export function submitStorefrontTransfer(orderId: string, payload: {
  bankAccountId: string;
  senderBank: string;
  reference: string;
  transferDate: string;
  amount: number;
  evidenceMediaId: string;
}) {
  return apiCommandRequest<Record<string, unknown>>(`/api/v1/storefront/orders/${orderId}/transfer`, {
    method: "POST",
    headers: storefrontHeaders(true),
    body: payload,
  });
}

export function listStorefrontOrders() {
  return apiRequest<StorefrontOrdersPage>("/api/v1/storefront/orders?page=1&pageSize=50", {
    headers: storefrontHeaders(true),
    cache: "no-store",
  });
}

export function listStorefrontBankAccounts(cartId: string) {
  return apiRequest<StorefrontBankAccount[]>(`/api/v1/storefront/bank-accounts?cartId=${encodeURIComponent(cartId)}`, {
    headers: storefrontHeaders(true),
    cache: "no-store",
  });
}

export function searchStorefrontPlaces(query: string, locale: string) {
  const params = new URLSearchParams({ q: query, locale });
  return apiRequest<Array<{ displayName: string; latitude: number; longitude: number }>>(
    `/api/v1/public/storefront/geocoding/search?${params.toString()}`,
    { headers: storefrontHeaders(), cache: "no-store" },
  );
}
