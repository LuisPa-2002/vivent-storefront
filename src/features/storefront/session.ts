import type { StorefrontCartSelection, StorefrontSession } from "@/features/storefront/types";

const SESSION_KEY = "vivent.storefront.session";
const CART_KEY = "vivent.storefront.cart";
const STORE_EVENT = "vivent-storefront-storage";

function notifyStorefrontStorage() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STORE_EVENT));
}

export function subscribeToStorefrontStorage(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function hasStorefrontSession() {
  return Boolean(getStorefrontSession()?.sessionToken);
}

export function getStorefrontSession(): StorefrontSession | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as StorefrontSession;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setStorefrontSession(session: StorefrontSession) {
  if (typeof window === "undefined") return;
  const previous = getStorefrontSession();
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, sessionToken: session.sessionToken ?? previous?.sessionToken ?? null }));
  notifyStorefrontStorage();
}

export function clearStorefrontSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(CART_KEY);
  notifyStorefrontStorage();
}

export function getStorefrontCartSelection(): StorefrontCartSelection | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(CART_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as StorefrontCartSelection;
  } catch {
    window.sessionStorage.removeItem(CART_KEY);
    return null;
  }
}

export function setStorefrontCartSelection(selection: StorefrontCartSelection) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CART_KEY, JSON.stringify(selection));
  notifyStorefrontStorage();
}

export function clearStorefrontCartSelection() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CART_KEY);
  notifyStorefrontStorage();
}
