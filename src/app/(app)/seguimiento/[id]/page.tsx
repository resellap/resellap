import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackingPanel } from "../tracking-panel";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { loadShipment } from "@/lib/tracking/data";

export const metadata: Metadata = { title: msg("Seguimiento del envío") };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ShipmentPage({ params }: PageProps<"/seguimiento/[id]">) {
  const t = await getT();
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const s = await loadShipment(id);
  if (!s) notFound();
  return (
    <>
      <PageHeader back={{ href: "/seguimiento", label: t("Seguimiento") }} title={s.product} description={t("Venta {number}", { number: s.number })} />
      <TrackingPanel shipment={s} showSaleLink />
    </>
  );
}
