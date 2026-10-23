"use client";
import { Bell, ChevronDown, ChevronRight, LayoutGrid, LogOut, Mail, Moon, Plus, Settings, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { savePreferences } from "@/app/(app)/configuracion/actions";
import type { Palette } from "@/lib/preferences";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "./brand";
import { LiquidBubble } from "./liquid";
import { IconEnvios, IconInicio, IconVentas, type RsIcon } from "./rs-icons";
import { RememberList, forgetAllLists, useRememberedHref } from "./list-memory";
import { NAV, type BadgeKey, type NavItem } from "./nav";
import { NavProgress } from "./nav-progress";
import { clsx } from "./ui";

export { Logo };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/ventas") return pathname === "/ventas" || (pathname.startsWith("/ventas/") && !pathname.startsWith("/ventas/nueva"));
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Enlace del menú. El de la sección en la que estás vuelve a la lista con
 * tus filtros; el de cualquier otra sección los olvida todos.
 */
function NavLink({ href, active, onClick, ...props }: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string; active: boolean }) {
  const remembered = useRememberedHref(href);
  return (
    <Link
      {...props}
      href={active ? remembered : href}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        if (!active) forgetAllLists();
        onClick?.(e);
      }}
    />
  );
}

/** Contador: verde para lo que espera una acción tuya, rojo para alertas, neutro para lo demás. */
function Counter({ n, k }: { n: number; k?: BadgeKey }) {
  if (n <= 0) return null;
  const tone = k === "alerts" ? "bg-danger text-white" : k === "shipments" || k === "detected" ? "bg-brand text-on-brand" : "bg-subtle text-ink-soft";
  return <span className={clsx("num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold", tone)}>{n}</span>;
}

const ROLE_LABEL = { admin: "Administrador", vendedor: "Vendedor", almacen: "Almacén" } as const;
type Badges = Record<BadgeKey, number>;

export function Shell({
  children,
  role,
  userLabel,
  badges,
  orgName,
  orgSwitcher,
  banner,
  permissions = [],
  appearance,
}: {
  children: ReactNode;
  role: "admin" | "vendedor" | "almacen";
  userLabel: string;
  badges: Badges;
  orgName: string;
  /** Selector de espacio (solo si el usuario pertenece a varios). */
  orgSwitcher?: ReactNode;
  /** Aviso fijo (prueba, pago pendiente, suscripción inactiva…). */
  banner?: ReactNode;
  /** Permisos efectivos (qué apartados ve). */
  permissions?: string[];
  /** Aspecto guardado (para el botón claro/oscuro). */
  appearance?: { mode: "auto" | "light" | "dark"; palette: Palette; reduceMotion: boolean };
}) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [cfg, setCfg] = useState(false);
  // Carril desplegado con la flechita: nunca se queda fijo
  const [railOpen, setRailOpen] = useState(false);
  // Destino pulsado: la burbuja sale hacia él al instante, sin esperar a que cargue
  const [goingTo, setGoingTo] = useState<string | null>(null);
  const here = goingTo ?? pathname;
  const go = (href: string) => () => setGoingTo(href.split("?")[0]);
  const topNav = useRef<HTMLElement>(null);
  const railNav = useRef<HTMLElement>(null);
  const themeBox = useRef<HTMLDivElement>(null);
  const tabList = useRef<HTMLUListElement>(null);
  const railBox = useRef<HTMLElement>(null);
  const cfgBox = useRef<HTMLDivElement>(null);
  const userMenu = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  // Claro u oscuro: el elegido, o el del dispositivo si está en automático
  const [mode, setModeState] = useState<"light" | "dark" | null>(appearance?.mode === "light" || appearance?.mode === "dark" ? appearance.mode : null);
  useEffect(() => {
    if (mode) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => setModeState(mq.matches ? "dark" : "light");
    read();
  }, [mode]);
  const setMode = (m: "light" | "dark") => {
    setModeState(m);
    document.documentElement.setAttribute("data-mode", m);
    if (appearance) void savePreferences("appearance", { mode: m, palette: appearance.palette, reduceMotion: appearance.reduceMotion }).then(() => router.refresh());
  };
  // Cerrar el submenú de Configuración al pulsar fuera o con Escape
  useEffect(() => {
    if (!cfg) return;
    const onDown = (e: MouseEvent) => {
      if (cfgBox.current && !cfgBox.current.contains(e.target as Node)) setCfg(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCfg(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [cfg]);
  // Carril desplegado: se recoge al pulsar fuera de él o con Escape
  useEffect(() => {
    if (!railOpen) return;
    const onDown = (e: MouseEvent) => {
      if (railBox.current && !railBox.current.contains(e.target as Node)) setRailOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setRailOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [railOpen]);
  const visible = (i: NavItem) => (!i.adminOnly || role === "admin") && (!i.perm || role === "admin" || permissions.includes(i.perm));
  const canSell = role === "admin" || permissions.includes("ventas_crear");
  const canSeeDetected = role === "admin" || permissions.includes("correo");
  const badgeOf = (i: NavItem) => (i.badgeKey ? badges[i.badgeKey] : 0);

  // Cerrar la hoja «Más» al cambiar de página
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setGoingTo(null);
    setMore(false);
    setCfg(false);
    setRailOpen(false);
  }
  useEffect(() => {
    if (userMenu.current) userMenu.current.open = false;
  }, [pathname]);
  // Hoja «Más»: <dialog> nativo (Escape, foco y fondo los gestiona el navegador)
  const sheet = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = sheet.current;
    if (!d) return;
    if (more && !d.open) d.showModal();
    if (!more && d.open) d.close();
  }, [more]);

  const initials = userLabel
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const account = (
    <div className="flex items-center gap-2">
      <Link href="/cuenta" className="flex min-w-0 flex-1 items-center gap-3 rounded-full p-1 hover:bg-subtle/70">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-[13px] font-semibold text-ink-soft">
          {initials || "·"}
        </span>
        <span className="min-w-0 flex-1 text-[13px] leading-tight">
          <span className="block truncate font-semibold text-ink">{userLabel}</span>
          <span className="block truncate text-faint">{ROLE_LABEL[role]} · Mi cuenta</span>
        </span>
      </Link>
      <form action="/auth/salir" method="post">
        <button
          className="press flex h-10 w-10 items-center justify-center rounded-full text-faint hover:bg-subtle hover:text-ink"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={17} strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );

  const itemClass = (active: boolean) =>
    clsx(
      "press group flex min-h-10 items-center gap-3 rounded-full px-3 text-[14px] font-medium",
      active ? "bg-subtle text-ink" : "text-muted hover:bg-subtle/70 hover:text-ink",
    );

  const renderGroup = (items: NavItem[]) => (
    <ul className="flex flex-col gap-0.5">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        const Icon = it.icon;
        return (
          <li key={it.href}>
            <NavLink href={it.href} active={active} className={itemClass(active)}>
              <Icon size={19} strokeWidth={1.75} className={active ? "text-brand" : "text-faint group-hover:text-ink"} />
              <span className="flex-1 truncate">{it.label}</span>
              <Counter n={badgeOf(it)} k={it.badgeKey} />
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  // ---------------- Ordenador: barra superior en píldoras + carril de iconos ----------------
  const SHORT: Record<string, string> = { "/detectadas": "Detectadas", "/envios": "Envíos" };
  const topItems = (NAV[0]?.items ?? []).filter(visible).filter((i) => i.href !== "/ventas/nueva");
  const railGroups = NAV.slice(1)
    .filter((g) => !g.footer)
    .map((g) => ({ label: g.label, items: g.items.filter(visible).filter((i) => i.href !== "/ventas/nueva") }))
    .filter((g) => g.items.length);
  const settingsItems = (NAV.find((g) => g.footer)?.items ?? []).filter(visible).filter((i) => i.href !== "/cuenta");
  const settingsActive = settingsItems.some((i) => isActive(pathname, i.href));

  const pill = "rs-card rounded-full bg-surface";
  // Carril: iconos; con la flechita se despliega y enseña los nombres.
  // El color de la opción activa lo pone la burbuja (rs-seg + data-on).
  const railBase = "press relative flex h-10 w-full shrink-0 items-center gap-3 rounded-full px-[10px] text-[13.5px] font-medium [@media(max-height:760px)]:h-9";
  const railItem = () => clsx(railBase, "rs-seg");
  const settingsBtn = (active: boolean) => clsx(railBase, "transition-colors duration-300", active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink");
  const railLabel = clsx("truncate whitespace-nowrap transition-opacity duration-150", railOpen ? "opacity-100 delay-75" : "pointer-events-none opacity-0");
  const railPill = clsx(
    "rs-ease flex flex-col gap-0.5 overflow-hidden rounded-[24px] border border-line-strong/70 bg-surface p-1 shadow-[var(--shadow-card)] [--seg-ink:var(--ink-soft)] transition-[width] duration-[450ms]",
    railOpen ? "w-60" : "w-12",
  );
  // Cualquier opción del carril lo vuelve a recoger
  const closeRail = () => setRailOpen(false);

  const topBar = (
    <header className="sticky top-0 z-40 hidden items-center gap-3 bg-gradient-to-b from-paper from-70% to-transparent px-6 pb-4 pt-4 lg:flex no-print 2xl:px-8">
      <Link href="/" aria-label="Resellap, inicio" className={clsx(pill, "press flex h-12 shrink-0 items-center px-5")}>
        <Logo size={22} />
      </Link>
      <nav ref={topNav} aria-label="Principal" className={clsx(pill, "no-scrollbar relative flex min-w-0 items-center gap-0.5 overflow-x-auto p-1")}>
        <LiquidBubble container={topNav} active={topItems.find((i) => isActive(here, i.href))?.href ?? null} />
        {topItems.map((it) => {
          const active = isActive(here, it.href);
          const n = badgeOf(it);
          return (
            <NavLink
              key={it.href}
              href={it.href}
              active={isActive(pathname, it.href)}
              data-bubble={it.href}
              onClick={go(it.href)}
              className={clsx(
                "rs-seg press flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium xl:px-4 xl:text-[13.5px]",
              )}
              data-on={String(active)}
            >
              {SHORT[it.href] ?? it.label}
              {n > 0 && (
                <span
                  className={clsx(
                    "num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold",
                    it.badgeKey === "alerts" ? "bg-danger text-white" : "bg-brand text-on-brand",
                  )}
                >
                  {n}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="flex-1" />
      {canSell && (
        <NavLink
          href="/ventas/nueva"
          active={pathname.startsWith("/ventas/nueva")}
          aria-label="Nueva venta"
          className="press flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-[14px] font-semibold text-on-brand shadow-[var(--shadow-card)] hover:bg-brand-strong xl:px-5"
        >
          <Plus size={18} strokeWidth={2.25} />
          <span className="hidden xl:inline">Nueva venta</span>
        </NavLink>
      )}
      <div className={clsx(pill, "hidden h-12 shrink-0 items-center gap-0.5 px-1 xl:flex")}>
        <Link
          href="/seguimiento?vista=alertas"
          className="press relative flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-subtle hover:text-ink"
          aria-label={badges.alerts > 0 ? `${badges.alerts} ${badges.alerts === 1 ? "alerta" : "alertas"} de envíos` : "Alertas de envíos"}
          title="Alertas de envíos"
        >
          <Bell size={18} strokeWidth={1.75} />
          {badges.alerts > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
        </Link>
        {canSeeDetected && (
          <Link
            href="/detectadas"
            className="press relative flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-subtle hover:text-ink"
            aria-label="Ventas detectadas en el correo"
            title="Ventas detectadas"
          >
            <Mail size={18} strokeWidth={1.75} />
            {badges.detected > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />}
          </Link>
        )}
      </div>
      <details ref={userMenu} className="group/user relative shrink-0">
        <summary className={clsx(pill, "press flex h-12 cursor-pointer list-none items-center gap-2.5 pl-1 pr-3 [&::-webkit-details-marker]:hidden")}>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-paper">
            {initials || "·"}
          </span>
          <span className="hidden max-w-[180px] text-left text-[13px] leading-tight 2xl:block">
            <span className="block truncate font-semibold text-ink">{userLabel}</span>
            <span className="block truncate text-[12px] text-faint">{orgName}</span>
          </span>
          <ChevronDown size={16} strokeWidth={1.75} className="text-faint transition-transform group-open/user:rotate-180" />
        </summary>
        <div className="rs-card absolute right-0 top-[calc(100%+8px)] z-50 w-72 animate-rise rounded-[var(--radius-md)] bg-surface p-2 shadow-[var(--shadow-pop)]">
          <div className="px-3 pb-2 pt-2">
            <p className="truncate text-[14px] font-semibold text-ink">{userLabel}</p>
            <p className="truncate text-[12.5px] text-faint">
              {ROLE_LABEL[role]} · {orgName}
            </p>
          </div>
          {orgSwitcher && <div className="px-1 pb-2">{orgSwitcher}</div>}
          <div className="border-t border-line pt-1.5">{account}</div>
        </div>
      </details>
    </header>
  );

  const rail = (
    <aside
      aria-label="Más secciones"
      ref={railBox}
      className="fixed bottom-4 left-6 top-[84px] z-30 hidden w-12 flex-col gap-2.5 lg:flex no-print 2xl:left-8 [@media(max-height:760px)]:gap-2"
    >
      <div ref={themeBox} className={clsx(railPill, "relative shrink-0")}>
        <LiquidBubble container={themeBox} active={mode} />
        {(
          [
            ["light", Sun, "Modo claro"],
            ["dark", Moon, "Modo oscuro"],
          ] as const
        ).map(([m, Icon, label]) => (
          <button key={m} type="button" onClick={() => { setMode(m); closeRail(); }} className={railItem()} data-bubble={m} data-on={String(mode === m)} aria-pressed={mode === m} title={label}>
            <Icon size={18} strokeWidth={1.75} className="shrink-0" />
            <span className={railLabel}>{label}</span>
          </button>
        ))}
      </div>
      <div className="relative flex min-h-0 shrink flex-col">
      <button
        type="button"
        onClick={() => setRailOpen((v) => !v)}
        aria-expanded={railOpen}
        aria-label={railOpen ? "Recoger el menú" : "Desplegar el menú con los nombres"}
        title={railOpen ? "Recoger" : "Ver nombres"}
        className={clsx(
          "press absolute -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-ink text-paper shadow-[0_0_0_3px_var(--paper),var(--shadow-pop)] rs-ease transition-[left] duration-[450ms] hover:bg-ink-soft",
          railOpen ? "left-[226px]" : "left-[34px]",
        )}
      >
        <ChevronRight size={15} strokeWidth={2.5} className={clsx("transition-transform duration-200", railOpen && "rotate-180")} />
      </button>
      <nav ref={railNav} aria-label="Gestión" className={clsx(railPill, "no-scrollbar relative min-h-0 shrink overflow-y-auto")}>
        <LiquidBubble container={railNav} active={railGroups.flatMap((g) => g.items).find((i) => isActive(here, i.href))?.href ?? null} />
        {railGroups.map((g, gi) => (
          <div key={gi} className={clsx("flex flex-col gap-0.5", gi > 0 && "mt-1 border-t border-line pt-1.5")}>
            {g.items.map((it) => {
              const active = isActive(here, it.href);
              const n = badgeOf(it);
              return (
                <NavLink key={it.href} href={it.href} active={isActive(pathname, it.href)} data-bubble={it.href} title={it.label} aria-label={it.label} onClick={() => { closeRail(); setGoingTo(it.href); }} className={railItem()} data-on={String(active)}>
                  <it.icon size={18} strokeWidth={1.75} className="shrink-0" />
                  {n > 0 && (
                    <span
                      className={clsx(
                        clsx("absolute left-[24px] top-1.5 h-2 w-2 rounded-full ring-2 ring-surface transition-opacity", railOpen && "opacity-0"),
                        it.badgeKey === "alerts" ? "bg-danger" : "bg-brand",
                      )}
                    />
                  )}
                  <span className={clsx(railLabel, "flex-1")}>{it.label}</span>
                  {n > 0 && (
                    <span className={clsx(railLabel, "shrink-0")}>
                      <Counter n={n} k={it.badgeKey} />
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      </div>
      <div className="min-h-0 flex-1" />
      {settingsItems.length > 0 && (
        <div ref={cfgBox} className="relative shrink-0">
          <div className={railPill}>
            <button
              type="button"
              onClick={() => { setCfg((v) => !v); closeRail(); }}
              aria-expanded={cfg}
              aria-controls="menu-config"
              title="Configuración"
              className={settingsBtn(settingsActive || cfg)}
            >
              <Settings size={18} strokeWidth={1.75} className={clsx("shrink-0 transition-transform duration-300", cfg && "rotate-90")} />
              <span className={railLabel}>Configuración</span>
            </button>
          </div>
          {cfg && (
            <div
              id="menu-config"
              className="absolute bottom-0 left-[60px] z-50 max-h-[calc(100dvh-110px)] w-64 animate-rise overflow-y-auto rounded-[var(--radius-md)] border border-line bg-surface-2 p-2 shadow-[var(--shadow-pop)]"
            >
              <p className="flex items-center gap-2 px-3 pb-2 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                <Settings size={13} strokeWidth={2} className="text-brand" />
                Configuración
              </p>
              <div className="rounded-[14px] bg-surface p-1 [&_a]:min-h-9 [&_a]:text-[13.5px]">{renderGroup(settingsItems)}</div>
            </div>
          )}
        </div>
      )}
    </aside>
  );

  // ---------------- Barra inferior (móvil y iPad en vertical) ----------------
  const tabs: { href: string; label: string; icon: RsIcon; badge?: number }[] = [
    { href: "/", label: "Inicio", icon: IconInicio },
    { href: "/ventas", label: "Ventas", icon: IconVentas },
    { href: "/envios", label: "Envíos", icon: IconEnvios, badge: badges.shipments },
  ];
  const tabsHere = isActive(here, "/") || isActive(here, "/ventas") || isActive(here, "/envios") || here.startsWith("/ventas/nueva");
  const tabClass = () =>
    clsx(
      "press relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium",
      "rs-seg [--seg-ink:var(--faint)]",
    );
  const pendingMore = badges.reviews + badges.emails + badges.detected + badges.listings + badges.alerts;

  const tabBar = (
    <nav
      aria-label="Accesos rápidos"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden no-print"
    >
      <ul ref={tabList} className="rs-card relative mx-auto flex max-w-md items-center rounded-full bg-surface/95 p-1.5 shadow-[var(--shadow-pop)] backdrop-blur-md">
        <LiquidBubble container={tabList} active={more || !tabsHere ? "mas" : (tabs.find((t) => isActive(here, t.href))?.href ?? null)} />
        {tabs.slice(0, 2).map((t) => {
          const active = !more && isActive(here, t.href);
          return (
            <li key={t.href} className="flex flex-1">
              <NavLink href={t.href} active={isActive(pathname, t.href)} data-bubble={t.href} onClick={go(t.href)} className={tabClass()} data-on={String(active)}>
                <t.icon size={23} strokeWidth={1.75} />
                {t.label}
              </NavLink>
            </li>
          );
        })}
        {canSell && (
          <li className="flex flex-1 justify-center">
            <NavLink
              href="/ventas/nueva"
              active={pathname.startsWith("/ventas/nueva")}
              aria-label="Nueva venta"
              className="press flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand text-on-brand"
            >
              <Plus size={26} strokeWidth={2} />
            </NavLink>
          </li>
        )}
        {tabs.slice(2).map((t) => {
          const active = !more && isActive(here, t.href);
          return (
            <li key={t.href} className="flex flex-1">
              <NavLink href={t.href} active={isActive(pathname, t.href)} data-bubble={t.href} onClick={go(t.href)} className={tabClass()} data-on={String(active)}>
                <span className="relative">
                  <t.icon size={23} strokeWidth={1.75} />
                  {!!t.badge && (
                    <span className="num absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-brand px-1 text-center text-[10.5px] font-semibold leading-[18px] text-on-brand ring-2 ring-surface">
                      {t.badge}
                    </span>
                  )}
                </span>
                {t.label}
              </NavLink>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" onClick={() => setMore(true)} data-bubble="mas" className={tabClass()} data-on={String(!tabsHere || more)} aria-expanded={more} aria-controls="menu-mas">
            <span className="relative">
              <LayoutGrid size={23} strokeWidth={1.75} />
              {pendingMore > 0 && <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />}
            </span>
            Más
          </button>
        </li>
      </ul>
    </nav>
  );

  const moreSheet = (
    <dialog
      ref={sheet}
      id="menu-mas"
      aria-label="Menú"
      onClose={() => setMore(false)}
      onClick={(e) => e.target === e.currentTarget && setMore(false)}
      className="mi-sheet max-h-[88dvh] overflow-hidden rounded-t-[var(--radius-lg)] bg-surface p-0 text-ink lg:hidden"
    >
      <div className="safe-bottom max-h-[88dvh] overflow-y-auto px-4 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <Logo size={24} />
          <button
            type="button"
            onClick={() => setMore(false)}
            className="press flex h-10 w-10 items-center justify-center rounded-full bg-subtle"
            aria-label="Cerrar"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex flex-col gap-5 pb-4">
          {NAV.map((g, gi) => {
            // Todo el menú, también lo que ya está en la barra de abajo (Inicio, Ventas, Envíos, Nueva venta)
            const items = g.items.filter(visible);
            if (!items.length) return null;
            return (
              <section key={gi}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">{g.label ?? "Día a día"}</p>
                <ul className="stagger grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {items.map((it) => {
                    const active = isActive(pathname, it.href);
                    const n = badgeOf(it);
                    return (
                      <li key={it.href}>
                        <NavLink
                          href={it.href}
                          active={active}
                          className={clsx(
                            "press relative flex h-full min-h-[84px] flex-col items-start justify-between gap-2 rounded-[20px] p-3 text-[12.5px] font-medium leading-tight",
                            active ? "bg-ink text-paper" : "bg-surface-2 text-ink-soft",
                          )}
                        >
                          <it.icon size={21} strokeWidth={1.75} className={active ? "text-brand-bright" : "text-faint"} />
                          <span>{it.label}</span>
                          {n > 0 && (
                            <span className="absolute right-2 top-2">
                              <Counter n={n} k={it.badgeKey} />
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          {orgSwitcher && <div className="rounded-[20px] bg-surface-2 p-3">{orgSwitcher}</div>}
          <div className="rounded-full bg-surface-2 p-1.5">{account}</div>
        </div>
      </div>
    </dialog>
  );

  return (
    <div className="min-h-dvh">
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      {topBar}
      {rail}

      {/* Barra superior (móvil y iPad en vertical) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-paper from-75% to-transparent px-4 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))] lg:hidden no-print">
        <Link href="/" aria-label="Resellap, inicio" className={clsx(pill, "press flex h-11 items-center px-4")}>
          <Logo size={20} />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span className={clsx(pill, "flex h-11 min-w-0 items-center truncate px-4 text-[12.5px] font-medium text-muted")}>{orgName}</span>
          {badges.alerts > 0 && (
            <Link
              href="/seguimiento?vista=alertas"
              className={clsx(pill, "press relative flex h-11 w-11 shrink-0 items-center justify-center")}
              aria-label={`${badges.alerts} ${badges.alerts === 1 ? "alerta" : "alertas"} de envíos`}
            >
              <Bell size={19} strokeWidth={1.75} />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" />
            </Link>
          )}
        </div>
      </header>
      {moreSheet}

      <Suspense fallback={null}>
        <RememberList />
      </Suspense>

      <main
        className={clsx(
          "rs-ease min-w-0 px-4 pb-32 pt-2 transition-[padding] duration-[450ms] sm:px-6 lg:pb-12 lg:pr-6 lg:pt-4 2xl:pr-8",
          // Con el menú desplegado, la pantalla se aparta: nada queda detrás del menú
          railOpen ? "lg:pl-[296px] 2xl:pl-[304px]" : "lg:pl-[104px] 2xl:pl-[120px]",
        )}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          {banner}
          {/* Cada pantalla entra con un fundido suave hacia arriba */}
          <div key={pathname} className="page-in">
            {children}
          </div>
        </div>
      </main>

      {tabBar}
    </div>
  );
}
