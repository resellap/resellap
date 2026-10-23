"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { ActionMessages, ConfirmAction, Modal, useServerAction } from "@/components/ui-client";
import type { Option } from "@/lib/types";
import { deleteProduct, deleteVariant, saveVariant } from "../actions";
import { ProductForm, type ProductFormValues } from "../product-form";

export function EditProductButton({ initial, brands, categories }: { initial: ProductFormValues; brands: Option[]; categories: Option[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("Editar producto")}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("Editar producto")} wide>
        <ProductForm initial={initial} brands={brands} categories={categories} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <ConfirmAction
      label={t("Eliminar")}
      title={t("Eliminar «{name}»", { name })}
      description={t("Solo se puede eliminar si no tiene stock. Su historial de compras y ventas se conserva.")}
      confirmLabel={t("Eliminar producto")}
      action={() => deleteProduct(id)}
      onDone={() => router.push("/productos")}
    />
  );
}

export function VariantEditor({
  productId,
  variant,
}: {
  productId: string;
  variant?: { id: string; name: string; sku: string | null; normal_sale_price: number | null; stock: number; canDelete: boolean };
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(variant?.name ?? "");
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [price, setPrice] = useState(variant?.normal_sale_price != null ? String(variant.normal_sale_price) : "");
  const save = useServerAction(saveVariant);
  const del = useServerAction(deleteVariant);
  const [armed, setArmed] = useState(false);
  return (
    <>
      {variant ? (
        <button className="text-xs font-semibold text-brand-ink hover:underline" onClick={() => setOpen(true)}>
          {t("Editar")}
        </button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          {t("Añadir variante")}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={variant ? t("Variante «{name}»", { name: variant.name }) : t("Nueva variante")}
        footer={
          <>
            {variant?.canDelete && (
              <Button
                variant="danger"
                className="mr-auto"
                disabled={del.pending}
                onClick={async () => {
                  // Doble pulsación para confirmar (evita borrados sin querer)
                  if (!armed) return setArmed(true);
                  const r = await del.run(variant.id);
                  if (r.ok) setOpen(false);
                }}
              >
                {armed ? t("¿Seguro? Pulsa otra vez") : t("Eliminar variante")}
              </Button>
            )}
            <Button onClick={() => setOpen(false)}>{t("Cancelar")}</Button>
            <Button
              variant="primary"
              disabled={save.pending || !name.trim()}
              onClick={async () => {
                const r = await save.run({ id: variant?.id, product_id: productId, name: name.trim(), sku: sku.trim() || null, normal_sale_price: price.trim().replace(",", ".") || null });
                if (r.ok) setOpen(false);
              }}
            >
              {t("Guardar")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label={t("Nombre")} required hint={t("Por ejemplo: Negro, Blanco, Dorado.")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label={t("SKU / referencia")}>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
          <Field label={t("Precio normal (€)")} hint={t("Déjalo vacío para usar el del producto.")}>
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          {variant && variant.stock > 0 && <p className="text-xs text-muted">{t("Tiene {stock} unidades en stock: no se puede eliminar.", { stock: variant.stock })}</p>}
        </div>
        <ActionMessages error={save.error ?? del.error} />
      </Modal>
    </>
  );
}
