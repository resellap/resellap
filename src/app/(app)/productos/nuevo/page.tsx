import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { loadCatalogOptions } from "@/lib/options";
import { ProductForm } from "../product-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Nuevo producto") };
}

export default async function NewProduct() {
  const t = await getT();
  await requirePerm("catalogo");
  const { brands, categories } = await loadCatalogOptions();
  return (
    <>
      <PageHeader title={t("Nuevo producto")} back={{ href: "/productos", label: t("Productos") }} />
      <Panel className="max-w-3xl">
        <ProductForm brands={brands} categories={categories} />
      </Panel>
    </>
  );
}
