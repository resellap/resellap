import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { loadSuppliers } from "@/lib/options";
import { PurchaseOrderForm } from "../po-form";

export const metadata: Metadata = { title: msg("Nuevo pedido de compra") };

export default async function NewPO() {
  const t = await getT();
  await requirePerm("compras");
  const suppliers = await loadSuppliers();
  return (
    <>
      <PageHeader title={t("Nuevo pedido de compra")} description={t("Proveedor, líneas y costes. Se guarda como pendiente hasta que llegue.")} back={{ href: "/compras", label: t("Compras") }} />
      <PurchaseOrderForm suppliers={suppliers} today={todayIso()} />
    </>
  );
}
