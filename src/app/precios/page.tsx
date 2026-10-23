import { getFormat, getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";
import { msg } from "@/i18n/translate";
import type { Metadata } from "next";
import { Check, MailCheck, MapPinned, PackageCheck, ChartColumn, Tag, Users } from "lucide-react";
import Link from "next/link";
import { ModulePattern } from "@/components/auth-layout";
import { CarrierIcon, PlatformIcon } from "@/components/marks";
import { PublicLayout } from "@/components/public-layout";
import { buttonClass } from "@/components/ui";
import { priceLabel, TRIAL_DAYS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("Resellap · Inventario y ventas para revendedores"),
  description: t("Detecta tus ventas de Vinted y Wallapop, controla el stock, los envíos y el beneficio real. {days} días gratis, después {price} al mes.", { days: TRIAL_DAYS, price: priceLabel() }),
};
}

const FLOW = [
  { n: "1", t: msg("Resellap detecta"), d: msg("Lee los correos de venta de Vinted y Wallapop: producto, comprador, precio, foto y transportista.") },
  { n: "2", t: msg("Te lo propone"), d: msg("Identifica el producto de tu inventario y te dice por qué. Si hay duda, te enseña las opciones.") },
  { n: "3", t: msg("Tú confirmas"), d: msg("Revisas, corriges si hace falta y confirmas. El stock se descuenta del lote correcto.") },
  { n: "4", t: msg("Envías"), d: msg("Pendientes por transportista, con la etiqueta a mano. Marcas «enviado» y empieza el seguimiento.") },
  { n: "5", t: msg("Sabes lo que ganas"), d: msg("Beneficio real por venta, tiempos de entrega por transportista e informes listos para exportar.") },
];

const FEATURES = [
  { icon: Tag, t: msg("Inventario por lotes"), d: msg("Cada unidad sabe de qué compra vino y cuánto costó. Margen y beneficio por producto.") },
  { icon: MailCheck, t: msg("Ventas detectadas"), d: msg("Las ventas llegan solas desde tu Gmail. Nada se registra sin que lo confirmes.") },
  { icon: PackageCheck, t: msg("Pendientes de envío"), d: msg("Separados por transportista, con etiqueta, fecha límite y foto del artículo.") },
  { icon: MapPinned, t: msg("Seguimiento"), d: msg("Estado de cada paquete, historial completo y avisos de retraso o incidencia.") },
  { icon: ChartColumn, t: msg("Informes"), d: msg("Ventas, inventario, compras, responsables y envíos. A Excel o CSV en un clic.") },
  { icon: Users, t: msg("Equipo"), d: msg("Administrador, vendedor y almacén, con permisos persona a persona.") },
];

export default async function PricingPage() {
  const t = await getT();
  const f = await getFormat();
  return (
    <PublicLayout>
      {/* Portada */}
      <section className="relative overflow-hidden bg-[#0B0F0E] px-5 pb-16 pt-12 text-[#F4F6F5] sm:pb-20 sm:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="animate-rise">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6FDCA6]">{t("Para quien revende en Vinted, Wallapop y más")}</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-[60px]">
              {rich(t("Sabes lo que tienes, lo que te costó <g>y lo que ganas.</g>"), { g: (c) => <span className="text-[#36C784]">{c}</span> })}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#B4BDB9]">
              {t("Resellap detecta tus ventas en el correo, te propone el producto y el transportista, y sigue cada envío hasta que llega. Sin hojas de cálculo.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registro" className={buttonClass("primary", "md", "h-12 px-5 text-[15px] sm:h-11")}>
                {t("Empezar {TRIAL_DAYS} días gratis", { TRIAL_DAYS })}
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center rounded-full border border-[#343C39] px-5 text-[15px] font-semibold text-[#F4F6F5] hover:bg-[#151A18] sm:h-11">
                {t("Ya tengo cuenta")}
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-[#8A9590]">{t("Sin tarjeta. Después, {price} al mes. Cancela cuando quieras.", { price: priceLabel() })}</p>
          </div>

          {/* Vista de ejemplo de la app */}
          <div aria-label={t("Ejemplo de una venta detectada")} className="relative">
            <ModulePattern className="pointer-events-none absolute -right-16 -top-10 w-[520px] max-w-none opacity-30" />
            <div className="relative rounded-[20px] border border-[#222927] bg-[#151A18] p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] sm:p-5" style={{ ["--ink" as string]: "#F4F6F5" }}>
              <div className="flex items-center gap-2 text-[12.5px] text-[#B4BDB9]">
                <PlatformIcon name="Vinted" size={18} />
                <span className="ml-1 rounded-full bg-[#052419] px-2 py-0.5 text-[11.5px] font-semibold text-[#6FDCA6]">{t("Nueva venta detectada")}</span>
                <span className="ml-auto">{t("ejemplo")}</span>
              </div>
              <div className="mt-4 flex items-start gap-3">
                <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-[#222927]">
                  <svg viewBox="0 0 64 32" width="44" height="22">
                    <rect x="2" y="6" width="24" height="18" rx="9" fill="#343C39" />
                    <rect x="38" y="6" width="24" height="18" rx="9" fill="#343C39" />
                    <rect x="24" y="12" width="16" height="3" rx="1.5" fill="#4B5551" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold text-white">{t("Gafas de sol de ejemplo")}</p>
                  <p className="text-[13px] text-[#8A9590]">{t("Comprador: lucia_88 · hoy")}</p>
                </div>
                <p className="num text-[22px] font-semibold text-white">{f.money(45)}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#222927] bg-[#222927] text-[13px]">
                <div className="bg-[#151A18] px-3 py-2.5">
                  <dt className="text-[#8A9590]">{t("Producto")}</dt>
                  <dd className="mt-0.5 font-medium text-white">{t("Identificado")} · {f.percent(96)}</dd>
                </div>
                <div className="bg-[#151A18] px-3 py-2.5">
                  <dt className="text-[#8A9590]">{t("Transportista")}</dt>
                  <dd className="mt-0.5 font-medium text-white">
                    <CarrierIcon name="InPost" size={16} />
                  </dd>
                </div>
                <div className="bg-[#151A18] px-3 py-2.5">
                  <dt className="text-[#8A9590]">{t("Coste del lote")}</dt>
                  <dd className="num mt-0.5 font-medium text-white">{f.money(12)}</dd>
                </div>
                <div className="bg-[#151A18] px-3 py-2.5">
                  <dt className="text-[#8A9590]">{t("Beneficio")}</dt>
                  <dd className="num mt-0.5 font-semibold text-[#6FDCA6]">+{f.money(31.8)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-2">
                <span className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#36C784] text-[14px] font-semibold text-[#0B0F0E]">{t("Confirmar venta")}</span>
                <span className="flex h-10 items-center justify-center rounded-full border border-[#343C39] px-3 text-[13.5px] text-[#D5DBD8]">{t("Ya estaba apuntada")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-ink">{t("Cómo funciona")}</p>
        <h2 className="display mt-3 max-w-2xl text-[32px] sm:text-[40px]">{t("Resellap hace el trabajo. Tú solo revisas.")}</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map((x) => (
            <li key={x.n} className="rs-card rounded-[var(--radius-md)] bg-surface p-5">
              <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-paper">{x.n}</span>
              <p className="mt-4 text-[16px] font-semibold">{t(x.t)}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t(x.d)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Funciones + precio */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <h2 className="display text-[30px] sm:text-[36px]">{t("Todo incluido")}</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((x) => (
                <li key={x.t} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper">
                    <x.icon size={20} strokeWidth={1.75} className="text-brand" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{t(x.t)}</span>
                    <span className="mt-0.5 block text-[14px] leading-relaxed text-muted">{t(x.d)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-fit rounded-[var(--radius-lg)] border border-line bg-paper p-6 sm:p-7">
            <p className="text-[13px] font-medium text-muted">{t("Plan único")}</p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="num font-[family-name:var(--font-display)] text-[52px] font-semibold leading-none tracking-[-0.03em]">{priceLabel()}</span>
              <span className="text-muted">{t("/ mes")}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{t("Sin permanencia. Cancela cuando quieras.")}</p>
            <ul className="mt-6 space-y-2.5 text-[14.5px]">
              {[t("{days} días de prueba gratis, sin tarjeta", { days: TRIAL_DAYS }), t("Usuarios del equipo incluidos"), t("Si cancelas, tus datos no se borran: puedes exportarlos"), t("Tus datos separados de los de cualquier otra empresa")].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
            <Link href="/registro" className={buttonClass("primary", "md", "mt-7 h-12 w-full text-[15px] sm:h-11")}>
              {t("Crear cuenta gratis")}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
