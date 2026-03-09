import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { ToastProvider } from "./components/ToastProvider";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import NavigationProgress from "./components/NavigationProgress";
import {
  BRAND_PRIMARY_COOKIE,
  DEFAULT_PRIMARY_COLOR,
  getBrandingThemeVariables,
  normalizeHexColor,
} from "@/lib/branding-theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vida Total",
  description: "Vida Total trainer dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const savedPrimaryColor =
    normalizeHexColor(cookieStore.get(BRAND_PRIMARY_COOKIE)?.value) ?? DEFAULT_PRIMARY_COLOR;
  const themeVariables = getBrandingThemeVariables(savedPrimaryColor) as CSSProperties;

  return (
    <html lang={locale} style={themeVariables}>
      <body className={`${spaceGrotesk.variable} text-lg antialiased`}>
        <NavigationProgress />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ServiceWorkerRegister />
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
