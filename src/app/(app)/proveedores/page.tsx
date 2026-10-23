import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Empty, PageHeader, Panel, Table, Td, Th, Tr } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { money, units } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { SupplierButton } from "./supplier-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Proveedores") };
}

export default async function SuppliersPage() {
  const t = await getT();
  await requirePerm("compras");
  const supabase = await createClient();
  const [{ data: suppliers }, { data: pos }] = await Promise.all([
    supabase.from("suppliers").select("*").is("deleted_at", null).order("is_placeholder", { ascending: false }).order("name"),
    supabase.from("v_purchase_orders").select("supplier_id, status, total_cost"),
  ]);
  const stats = new Map<string, { orders: number; total: number }>();
  for (const p of pos ?? []) {
    if (p.status === "cancelado") continue;
    const s = stats.get(p.supplier_id) ?? { orders: 0, total: 0 };
    s.orders++;
    s.total += Number(p.total_cost);
    stats.set(p.supplier_id, s);
  }
  return (
    <>
      <PageHeader title={t("Proveedores")} description={t("A quién compras, con su historial de pedidos e importe total.")} actions={<SupplierButton />} />
      <Panel padded={false}>
        {(suppliers ?? []).length === 0 ? (
          <Empty title={t("Aún no hay proveedores")} action={<SupplierButton label={t("Crear el primero")} />} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Proveedor")}</Th>
                <Th>{t("Contacto")}</Th>
                <Th>{t("Email")}</Th>
                <Th>{t("Teléfono")}</Th>
                <Th num>{t("Pedidos")}</Th>
                <Th num>{t("Total comprado")}</Th>
              </tr>
            </thead>
            <tbody>
              {(suppliers ?? []).map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <Link href={`/proveedores/${s.id}`} className="font-semibold hover:underline">
                      {s.name}
                    </Link>
                    {s.is_placeholder && (
                      <span className="ml-2">
                        <Badge tone="warn">{t("Sustituir por el real")}</Badge>
                      </span>
                    )}
                  </Td>
                  <Td>{s.contact_name ?? "—"}</Td>
                  <Td>{s.email ?? "—"}</Td>
                  <Td>{s.phone ?? "—"}</Td>
                  <Td num>{units(stats.get(s.id)?.orders ?? 0)}</Td>
                  <Td num>{money(stats.get(s.id)?.total ?? 0)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
