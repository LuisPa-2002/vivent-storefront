"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginStorefront, registerStorefront, requestStorefrontPasswordReset } from "@/features/storefront/api";
import { setStorefrontSession } from "@/features/storefront/session";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import type { StorefrontLocale } from "@/features/storefront/types";

type AuthMode = "login" | "register" | "recover";

export function StorefrontAuthScreen({ locale, mode }: Readonly<{ locale: StorefrontLocale; mode: AuthMode }>) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const base = `/${locale}/tienda`;
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: mode === "login" ? "cliente@demo.corpoviva.com" : "",
    password: mode === "login" ? "ChangeMe123!" : "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "login") return loginStorefront(form.email, form.password);
      if (mode === "register") return registerStorefront(form);
      await requestStorefrontPasswordReset(form.email);
      return null;
    },
    onSuccess: (session) => {
      if (mode === "login" && session?.sessionToken) {
        setStorefrontSession(session);
        router.push(`${base}/comprar`);
        return;
      }
      setMessage(mode === "register" ? t("auth.registered") : t("auth.resetRequested"));
    },
  });

  const title = mode === "login" ? t("auth.loginTitle") : mode === "register" ? t("auth.registerTitle") : t("auth.recoverTitle");
  const description = mode === "login" ? t("auth.loginDescription") : mode === "register" ? t("auth.registerDescription") : t("auth.recoverDescription");

  return (
    <StorefrontShell locale={locale}>
      <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
        <div className="rounded-[2.4rem] bg-[#17382b] p-8 text-white shadow-[0_30px_90px_rgba(23,56,43,.2)] lg:p-12">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em]">Demo Vivent GT</span>
          <h1 className="mt-8 text-4xl font-black leading-[.96] tracking-[-.06em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-lg leading-7 text-white/68">{description}</p>
          <div className="mt-10 space-y-4 text-sm">
            <div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-[#f5b05f]" /><span>{t("auth.noOauth")}</span></div>
            <div className="flex gap-3"><CheckCircle2 className="size-5 shrink-0 text-[#8cc7a8]" /><span>Sesión independiente del personal interno</span></div>
          </div>
          {mode === "login" ? (
            <div className="mt-10 rounded-2xl border border-white/15 bg-white/8 p-5">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#f5b05f]">{t("auth.demoTitle")}</p>
              <p className="mt-2 break-all font-mono text-sm text-white/85">{t("auth.demoCredentials")}</p>
            </div>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-xl rounded-[2.4rem] border border-[#17382b]/10 bg-white p-7 shadow-[0_25px_80px_rgba(23,56,43,.1)] sm:p-10">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-[#f3e6d5] text-[#d96f32]">
            {mode === "login" ? <KeyRound /> : mode === "register" ? <UserPlus /> : <Mail />}
          </div>
          {message ? (
            <div className="rounded-2xl bg-[#e5f2e9] p-5 font-semibold text-[#176a48]">{message}</div>
          ) : (
            <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
              {mode === "register" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("auth.firstName")} value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} />
                  <Field label={t("auth.lastName")} value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
                </div>
              ) : null}
              <Field label={t("auth.email")} type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
              {mode !== "recover" ? <Field label={t("auth.password")} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} /> : null}
              {mode === "register" ? <Field label={t("auth.phone")} type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /> : null}
              {mutation.error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{mutation.error.message}</p> : null}
              <Button className="mt-2 h-12 rounded-full bg-[#176a48]" disabled={mutation.isPending} type="submit">
                {mode === "login" ? t("auth.login") : mode === "register" ? t("auth.register") : t("auth.recover")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          )}
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#66776c]">
            {mode === "login" ? <><Link className="text-[#176a48]" href={`${base}/registro`}>{t("auth.needAccount")}</Link><Link href={`${base}/recuperar`}>{t("auth.forgot")}</Link></> : <Link className="text-[#176a48]" href={`${base}/login`}>{t("auth.haveAccount")}</Link>}
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}

function Field({ label, value, onChange, type = "text" }: Readonly<{ label: string; value: string; onChange: (value: string) => void; type?: string }>) {
  return <div className="space-y-2"><Label>{label}</Label><Input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl bg-[#f7f3ea]" /></div>;
}
