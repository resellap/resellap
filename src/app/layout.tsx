import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { BootSplash } from "@/components/boot-splash";
import { I18nProvider } from "@/i18n/client";
import { INTL_TAG } from "@/i18n/config";
import { getLocale, getT, loadDict } from "@/i18n/server";
import { APPEARANCE_COOKIE, parseAppearanceCookie } from "@/lib/preferences";
import { SITE_URL } from "@/lib/site";
import "@fontsource-variable/instrument-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const DESCRIPTION = t("Inventario, ventas detectadas, envíos y beneficio real para quien revende en Vinted, Wallapop y más.");
  return {
  metadataBase: new URL(SITE_URL),
  title: { default: "Resellap", template: "%s · Resellap" },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  // Instalada desde Safari («Añadir a pantalla de inicio») se abre como una app
  applicationName: "Resellap",
  appleWebApp: { capable: true, title: "Resellap", statusBarStyle: "default" },
  icons: { apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180" }] },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Resellap",
    title: "Resellap",
    description: DESCRIPTION,
    locale: INTL_TAG[t.locale].replace("-", "_"),
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Resellap" }],
  },
  twitter: { card: "summary_large_image", title: "Resellap", description: DESCRIPTION, images: ["/brand/og.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#090c0b",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Aspecto elegido por el usuario (se guarda también en una cookie para pintar ya con él)
  const a = parseAppearanceCookie((await cookies()).get(APPEARANCE_COOKIE)?.value);
  const locale = await getLocale();
  const dict = await loadDict(locale);
  return (
    <html
      lang={locale}
      className="h-full antialiased"
      data-mode={a.mode}
      data-motion={a.reduceMotion ? "reduce" : undefined}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <BootSplash />
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
