"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { createContext, useContext, useState } from "react";
import { Toaster } from "sonner";
import { clientMessages, type AppLocale } from "@/lib/i18n/messages";

export function StorefrontProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocale] = useState<AppLocale>("es-GT");
  const [timeZone, setTimeZone] = useState("America/Guatemala");
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return <StorefrontLocaleContext.Provider value={{ locale, setLocale, timeZone, setTimeZone }}><NextIntlClientProvider locale={locale} messages={clientMessages[locale] as AbstractIntlMessages} timeZone={timeZone}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider><Toaster closeButton position="top-right" /></NextIntlClientProvider></StorefrontLocaleContext.Provider>;
}

type Context = { locale: AppLocale; setLocale: (locale: AppLocale) => void; timeZone: string; setTimeZone: (value: string) => void };
const StorefrontLocaleContext = createContext<Context | null>(null);
export function useAppLocale() {
  const context = useContext(StorefrontLocaleContext);
  if (!context) throw new Error("useAppLocale must be used within StorefrontProviders");
  return context;
}
