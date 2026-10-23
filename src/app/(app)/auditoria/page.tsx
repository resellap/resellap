import { getT } from "@/i18n/server";
import { msg } from "@/i18n/translate";
import type { Metadata } from "next";
import { FilterBar } from "@/components/filter-bar";
import { Badge, Empty, PageHeader, Pagination, Panel, Table, Td, Th, Tr } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { first, pageFrom, toQuery, type SearchParams } from "@/lib/filters";
import { dateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Auditoría") };
}

const ENTITIES: Record<string, string> = {
  sales: msg("Ventas"),
  sale_items: msg("Líneas de venta"),
  products: msg("Productos"),
  product_variants: msg("Variantes"),
  purchase_orders: msg("Pedidos de compra"),
  purchase_order_items: msg("Líneas de compra"),
  purchase_order_costs: msg("Costes de compra"),
  stock_exits: msg("Salidas sin venta"),
  stock_adjustments: msg("Ajustes de stock"),
  returns: msg("Devoluciones"),
  return_items: msg("Líneas de devolución"),
  responsibles: msg("Responsables"),
  suppliers: msg("Proveedores"),
  profiles: msg("Usuarios"),
  partner_transfers: msg("Pagos entre socios"),
  import_batches: msg("Importaciones"),
  review_items: msg("Revisión"),
  categories: msg("Categorías"),
  brands: msg("Marcas"),
  platforms: msg("Plataformas"),
  carriers: msg("Transportistas"),
  mobile_devices: msg("Móviles"),
  mobile_device_accounts: msg("Cuentas de móviles"),
};

/** Acciones del registro (las que no estén aquí se muestran tal cual, sin guiones bajos). */
const ACTIONS: Record<string, string> = {
  crear: msg("crear"),
  modificar: msg("modificar"),
  eliminar: msg("eliminar"),
  preferencias: msg("preferencias"),
  restablecer_preferencias: msg("restablecer preferencias"),
  crear_venta: msg("crear venta"),
  crear_producto: msg("crear producto"),
  ajuste_stock: msg("ajuste de stock"),
  anular_venta: msg("anular venta"),
  conectar_gmail: msg("conectar Gmail"),
  desconectar_gmail: msg("desconectar Gmail"),
  crear_organizacion: msg("crear espacio"),
  crear_devolucion: msg("crear devolución"),
  invitar_miembro: msg("invitar miembro"),
  quitar_miembro: msg("quitar miembro"),
  cambiar_rol: msg("cambiar rol"),
  aceptar_invitacion: msg("aceptar invitación"),
  venta_duplicada: msg("venta duplicada"),
  importacion: msg("importación"),
  solicitar_eliminacion: msg("solicitar eliminación"),
  anular_eliminacion: msg("anular eliminación"),
  cerrar_sesiones: msg("cerrar sesiones"),
  copia_seguridad: msg("copia de seguridad"),
  comprobar_copia: msg("comprobar copia"),
  exportar: msg("exportar"),
  exportar_mis_datos: msg("exportar mis datos"),
}

const HIDDEN = new Set(["updated_at", "created_at", "id"]);

function changes(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  if (!oldData || !newData) return [];
  return Object.keys(newData)
    .filter((k) => !HIDDEN.has(k) && JSON.stringify(oldData[k]) !== JSON.stringify(newData[k]))
    .map((k) => ({ k, from: oldData[k], to: newData[k] }));
}

const short = (v: unknown) => {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requireAdmin();
  const sp = await searchParams;
  const entity = first(sp.entidad);
  const from = first(sp.from);
  const to = first(sp.to);
  const user = first(sp.usuario);
  const { page, from: a, to: b, size } = pageFrom(sp, 50);
  const supabase = await createClient();
  let q = supabase.from("audit_log").select("*", { count: "exact" });
  if (entity) q = q.eq("entity", entity);
  if (from) q = q.gte("occurred_at", `${from}T00:00:00`);
  if (to) q = q.lte("occurred_at", `${to}T23:59:59`);
  if (user) q = q.ilike("user_email", `%${user}%`);
  const res = await q.order("occurred_at", { ascending: false }).order("id", { ascending: false }).range(a, b);
  const data = must(res, t("la auditoría"));
  const count = res.count;
  const values = { entidad: entity, from, to, usuario: user };

  return (
    <>
      <PageHeader title={t("Auditoría")} description={t("Quién hizo qué y cuándo: altas, cambios, anulaciones, recepciones, ajustes e importaciones.")} />
      <FilterBar
        basePath="/auditoria"
        values={values}
        fields={[
          { type: "select", name: "entidad", label: t("Sección"), empty: t("Todas"), options: Object.entries(ENTITIES).map(([value, label]) => ({ value, label: t(label) })) },
          { type: "text", name: "usuario", label: t("Usuario"), placeholder: t("Email") },
          { type: "date", name: "from", label: t("Desde") },
          { type: "date", name: "to", label: t("Hasta") },
        ]}
      />
      <Panel padded={false}>
        {(data ?? []).length === 0 ? (
          <Empty title={t("Sin registros")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Fecha")}</Th>
                <Th>{t("Usuario")}</Th>
                <Th>{t("Acción")}</Th>
                <Th>{t("Sección")}</Th>
                <Th>{t("Detalle")}</Th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => {
                const diff = changes(r.old_data, r.new_data);
                return (
                  <Tr key={r.id}>
                    <Td className="num whitespace-nowrap">{dateTime(r.occurred_at)}</Td>
                    <Td>{r.user_email ?? <span className="text-muted">{t("Sistema")}</span>}</Td>
                    <Td>
                      <Badge tone={r.action === "eliminar" || r.action.startsWith("anular") ? "bad" : r.action === "crear" ? "good" : "neutral"}>{ACTIONS[r.action] ? t(ACTIONS[r.action]) : r.action.replace(/_/g, " ")}</Badge>
                    </Td>
                    <Td>{ENTITIES[r.entity] ? t(ENTITIES[r.entity]) : r.entity}</Td>
                    <Td className="text-[13px]">
                      {r.summary && <span className="block">{t(r.summary)}</span>}
                      {diff.slice(0, 6).map((d) => (
                        <span key={d.k} className="block text-muted">
                          {d.k}: {short(d.from)} → {short(d.to)}
                        </span>
                      ))}
                      {!r.summary && diff.length === 0 && r.new_data?.name && <span className="text-muted">{String(r.new_data.name)}</span>}
                      {r.entity_id && <span className="block text-faint">id {String(r.entity_id).slice(0, 8)}</span>}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Pagination page={page} size={size} total={count ?? 0} hrefFor={(p) => `/auditoria${toQuery({ ...values, page: p })}`} />
      </Panel>
    </>
  );
}
