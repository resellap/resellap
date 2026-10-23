import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { todayIso } from "@/lib/format";
import { loadSaleOptions } from "@/lib/options";
import { loadPrefs } from "@/lib/user-prefs";
import { SaleForm } from "./sale-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Nueva venta") };
}

export default async function NewSalePage() {
  const t = await getT();
  const user = await requireUser();
  if (!can(user, "ventas_crear")) redirect("/?aviso=sin-permiso");
  const [opts, prefs] = await Promise.all([loadSaleOptions(), loadPrefs()]);
  // Plataforma predeterminada (Ajustes → Ventas e inventario), si sigue activa
  const defaultPlatform = opts.platforms.some((p) => p.id === prefs.sales.defaultPlatformId) ? prefs.sales.defaultPlatformId : null;
  const isAdmin = user.role === "admin";
  return (
    <>
      <PageHeader title={t("Nueva venta")} description={t("Producto, lote de procedencia, unidades, precio y plataforma.")} back={{ href: "/ventas", label: t("Ventas") }} />
      {!isAdmin && !user.responsibleId ? (
        <Notice tone="warn" title={t("Tu usuario no está vinculado a un responsable")}>
          {t("Pide al administrador que te vincule desde Responsables para poder registrar ventas.")}
        </Notice>
      ) : (
        <SaleForm
          isAdmin={isAdmin}
          today={todayIso()}
          responsibles={opts.responsibles}
          ownResponsible={user.responsibleId ? { id: user.responsibleId, name: user.responsibleName ?? "" } : null}
          platforms={opts.platforms}
          carriers={opts.carriers}
          mobiles={opts.mobiles}
          defaultPlatformId={defaultPlatform}
        />
      )}
    </>
  );
}
