import { msg } from "@/i18n/translate";
import type { Perm } from "@/lib/permissions";
import { IconCompras, IconDetectadas, IconEnvios, IconInformes, IconInicio, IconInventario, IconSeguimiento, IconVentas, type RsIcon } from "@/components/rs-icons";
import {
  ArrowLeftRight,
  Boxes,
  CirclePlus,
  CreditCard,
  Factory,
  FileSpreadsheet,
  Handshake,
  List,
  ListChecks,
  Mail,
  Megaphone,
  ScrollText,
  Settings,
  Undo2,
  UserCog,
  UserRound,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export type BadgeKey = "reviews" | "shipments" | "emails" | "detected" | "listings" | "alerts";

export type NavItem = {
  href: string;
  label: string;
  icon: RsIcon | LucideIcon;
  adminOnly?: boolean;
  /** Permiso necesario para verlo (el administrador los tiene todos). */
  perm?: Perm;
  badgeKey?: BadgeKey;
};
export type NavGroup = { label: string | null; items: NavItem[]; /** Va abajo, separado (Configuración y Cuenta). */ footer?: boolean };

/**
 * Menú de Resellap. Arriba, el flujo del día a día (inventario → venta →
 * envío → seguimiento → informes); después, la gestión y la configuración.
 */
export const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/", label: msg("Inicio"), icon: IconInicio },
      { href: "/productos", label: msg("Inventario"), icon: IconInventario },
      { href: "/ventas", label: msg("Ventas"), icon: IconVentas },
      { href: "/detectadas", label: msg("Ventas detectadas"), icon: IconDetectadas, badgeKey: "detected", perm: "correo" },
      { href: "/envios", label: msg("Pendientes de envío"), icon: IconEnvios, badgeKey: "shipments" },
      { href: "/seguimiento", label: msg("Seguimiento"), icon: IconSeguimiento, badgeKey: "alerts" },
      { href: "/informes", label: msg("Informes"), icon: IconInformes, perm: "costes" },
    ],
  },
  {
    label: msg("Gestión"),
    items: [
      { href: "/ventas/nueva", label: msg("Nueva venta"), icon: CirclePlus, perm: "ventas_crear" },
      { href: "/compras", label: msg("Compras"), icon: IconCompras, perm: "compras" },
      { href: "/proveedores", label: msg("Proveedores"), icon: Factory, perm: "compras" },
      { href: "/inventario", label: msg("Lotes y costes"), icon: Boxes, perm: "costes" },
      { href: "/anuncios", label: msg("Anuncios"), icon: Megaphone, badgeKey: "listings", perm: "anuncios" },
      { href: "/descripciones", label: msg("Generador de descripciones"), icon: WandSparkles, perm: "generador" },
      { href: "/devoluciones", label: msg("Devoluciones"), icon: Undo2, perm: "ventas_editar" },
      { href: "/salidas", label: msg("Salidas y ajustes"), icon: ArrowLeftRight, perm: "stock" },
      { href: "/reparto", label: msg("Reparto entre socios"), icon: Handshake, perm: "costes" },
    ],
  },
  {
    label: msg("Automatización y datos"),
    items: [
      { href: "/correos", label: msg("Ventas por correo"), icon: Mail, badgeKey: "emails", perm: "correo" },
      { href: "/importar", label: msg("Importar Excel"), icon: FileSpreadsheet, perm: "importar" },
      { href: "/revision", label: msg("Pendientes de revisar"), icon: ListChecks, badgeKey: "reviews", perm: "importar" },
    ],
  },
  {
    label: msg("Configuración"),
    footer: true,
    items: [
      { href: "/configuracion", label: msg("Configuración"), icon: Settings },
      { href: "/ajustes", label: msg("Listas"), icon: List, perm: "configuracion" },
      { href: "/responsables", label: msg("Responsables"), icon: Users, perm: "configuracion" },
      { href: "/equipo", label: msg("Equipo"), icon: UserCog, adminOnly: true },
      { href: "/suscripcion", label: msg("Suscripción"), icon: CreditCard, adminOnly: true },
      { href: "/auditoria", label: msg("Auditoría"), icon: ScrollText, adminOnly: true },
      { href: "/cuenta", label: msg("Cuenta"), icon: UserRound },
    ],
  },
];
