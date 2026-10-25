import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StorefrontProviders } from "@/components/providers/storefront-providers";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "Vivent Store", template: "%s | Vivent Store" },
  description: "Vivent commerce storefront.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1c2822" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-GT" className={`${geistSans.variable} ${geistMono.variable}`}><body className="min-h-screen font-sans antialiased"><StorefrontProviders>{children}</StorefrontProviders></body></html>;
}
