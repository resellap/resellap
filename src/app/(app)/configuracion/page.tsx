import { msg } from "@/i18n/translate";
import { getFormat, getT } from "@/i18n/server";
import { LanguagePicker } from "@/components/language-picker";
import type { Metadata } from "next";
import Link from "next/link";
import { Bell, ChevronRight, DatabaseBackup, History, LayoutDashboard, List, Palette, Receipt, ShieldCheck, Table2, type LucideIcon } from "lucide-react";
import { PageHeader, Panel, clsx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";
import { ResetAllButton } from "./reset-all";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ajustes") };
}

type Item = { href: string; title: string; text: string; icon: LucideIcon; admin?: boolean; perm?: Perm };
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: msg("Personalización"),
    items: [
      { href: "/configuracion/panel", title: msg("Personalizar panel"), text: msg("Widgets del inicio, tamaño, orden y periodo de análisis."), icon: LayoutDashboard, perm: "costes" },
      { href: "/configuracion/aspecto", title: msg("Personalizar aspecto"), text: msg("Claro u oscuro, tema de color y animaciones."), icon: Palette },
      { href: "/configuracion/tablas", title: msg("Tablas"), text: msg("Columnas, orden y filas por página de ventas y productos."), icon: Table2, perm: "costes" },
      { href: "/configuracion/ventas", title: msg("Ventas e inventario"), text: msg("Plataforma predeterminada al registrar una venta."), icon: Receipt },
      { href: "/configuracion/avisos", title: msg("Avisos"), text: msg("Qué tareas y contadores quieres ver."), icon: Bell },
    ],
  },
  {
    label: msg("Cuenta y datos"),
    items: [
      { href: "/configuracion/seguridad", title: msg("Seguridad y privacidad"), text: msg("Contraseña, sesiones, tus datos y privacidad."), icon: ShieldCheck },
      { href: "/configuracion/copias", title: msg("Copias de seguridad"), text: msg("Descargar una copia completa de los datos y comprobarla."), icon: DatabaseBackup, admin: true },
      { href: "/configuracion/actividad", title: msg("Historial de actividad"), text: msg("Tus exportaciones, copias y cambios de ajustes."), icon: History },
      { href: "/ajustes", title: msg("Listas"), text: msg("Plataformas, transportistas, móviles, categorías y marcas."), icon: List, perm: "configuracion" },
    ],
  },
];

export default async function SettingsHub() {
  const t = await getT();
  const f = await getFormat();
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  return (
    <>
      <PageHeader title={t("Ajustes")} description={t("Tus preferencias se guardan en tu usuario: las verás igual en el iPhone, el iPad y el ordenador, y no cambian las de nadie más.")} />
      <div className="flex flex-col gap-6">
        {GROUPS.map((g) => (
          <section key={g.label} aria-label={t(g.label)}>
            <h2 className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">{t(g.label)}</h2>
            <ul className="grid gap-2.5 md:grid-cols-2">
              {g.items
                .filter((i) => (!i.admin || isAdmin) && (!i.perm || can(user, i.perm)))
                .map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className="press flex min-h-16 items-center gap-3 rs-card rounded-[var(--radius-md)] bg-surface p-3.5 shadow-[var(--shadow-card)] hover:border-ink/30"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-soft text-brand-ink">
                        <i.icon size={20} strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{t(i.title)}</span>
                        <span className="block text-[13px] text-muted">{t(i.text)}</span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title={t("Idioma y formato")} description={t("El idioma se guarda en tu usuario. Las fechas, los números y los importes siguen el formato de ese idioma.")}>
            <LanguagePicker current={t.locale} className="mb-4 w-full max-w-xs" />
            <dl className={clsx("grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm")}>
              <dt className="text-muted">{t("Moneda")}</dt>
              <dd>{t("Euro (€). Los importes no se convierten a otras monedas.")}</dd>
              <dt className="text-muted">{t("Fechas")}</dt>
              <dd className="num">{f.date("2026-12-31")}</dd>
              <dt className="text-muted">{t("Números")}</dt>
              <dd className="num">{f.money(1234.56)}</dd>
              <dt className="text-muted">{t("Zona horaria")}</dt>
              <dd>{t("Hora de Madrid (Europa/Madrid)")}</dd>
            </dl>
          </Panel>
          <Panel title={t("Restablecer ajustes")} description={t("Vuelve a la configuración inicial: panel, aspecto, tablas, avisos y preferencias.")}>
            <p className="mb-3 text-sm text-ink-soft">{t("Solo afecta a tus ajustes. No borra ventas, productos, inventario ni ningún otro dato.")}</p>
            <ResetAllButton />
          </Panel>
        </div>
      </div>
    </>
  );
}
