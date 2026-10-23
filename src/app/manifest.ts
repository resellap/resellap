import { getT } from "@/i18n/server";
import type { MetadataRoute } from "next";

/**
 * Manifiesto de la app: permite añadir Resellap a la pantalla de
 * inicio del iPhone/iPad (Safari → Compartir → Añadir a pantalla de inicio)
 * y que se abra a pantalla completa, como una app, sin barra de Safari.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getT();
  return {
    id: "/",
    name: "Resellap",
    short_name: "Resellap",
    description: t("Inventario, ventas, compras y rentabilidad."),
    lang: t.locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#121110",
    theme_color: "#121110",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
