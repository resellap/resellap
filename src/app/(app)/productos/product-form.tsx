"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadProductPhotos } from "@/components/photo-upload";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui";
import type { Option } from "@/lib/types";
import { createProduct, updateProduct } from "./actions";

export type ProductFormValues = {
  id?: string;
  name: string;
  brand_name: string;
  category_name: string;
  sku: string;
  description: string;
  normal_sale_price: string;
  notes: string;
};

export function ProductForm({ initial, brands, categories, onDone }: { initial?: ProductFormValues; brands: Option[]; categories: Option[]; onDone?: () => void }) {
  const t = useT();
  const router = useRouter();
  const editing = !!initial?.id;
  const [v, setV] = useState<ProductFormValues>(
    initial ?? { name: "", brand_name: "", category_name: "", sku: "", description: "", normal_sale_price: "", notes: "" },
  );
  const [variants, setVariants] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (k: keyof ProductFormValues) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      name: v.name.trim(),
      brand_name: v.brand_name.trim() || null,
      category_name: v.category_name.trim() || null,
      sku: v.sku.trim() || null,
      description: v.description.trim() || null,
      normal_sale_price: v.normal_sale_price.trim().replace(",", ".") || null,
      notes: v.notes.trim() || null,
    };
    let id = initial?.id;
    if (editing) {
      const r = await updateProduct({ id: id!, ...payload });
      if (!r.ok) {
        setPending(false);
        setError(r.error);
        return;
      }
    } else {
      const r = await createProduct({ ...payload, variants: variants.map((n) => n.trim()).filter(Boolean).map((name) => ({ name })) });
      if (!r.ok || !r.data) {
        setPending(false);
        setError(r.ok ? t("No se ha podido crear.") : r.error);
        return;
      }
      id = r.data;
    }
    let photoError = false;
    if (photos.length && id) {
      const up = await uploadProductPhotos(id, photos, (p) => setProgress(t("Subiendo fotos: {done} de {total}", { done: p.done, total: p.total })));
      photoError = up.errors.length > 0;
    }
    setProgress(null);
    setPending(false);
    if (onDone) {
      onDone();
      router.refresh();
    } else router.push(`/productos/${id}${photoError ? "?fotos=error" : ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Nombre")} required className="sm:col-span-2">
          <Input value={v.name} onChange={set("name")} autoFocus={!editing} />
        </Field>
        <Field label={t("Marca")} hint={t("Escribe una nueva o elige una existente.")}>
          <Input value={v.brand_name} onChange={set("brand_name")} list="marcas" />
          <datalist id="marcas">
            {brands.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
        </Field>
        <Field label={t("Categoría")}>
          <Input value={v.category_name} onChange={set("category_name")} list="categorias" />
          <datalist id="categorias">
            {categories.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
        </Field>
        <Field label={t("SKU / referencia")} hint={t("Único: no puede repetirse.")}>
          <Input value={v.sku} onChange={set("sku")} />
        </Field>
        <Field label={t("Precio normal de venta (€)")}>
          <Input inputMode="decimal" value={v.normal_sale_price} onChange={set("normal_sale_price")} placeholder="0,00" />
        </Field>
        <Field label={t("Descripción")} className="sm:col-span-2">
          <Textarea value={v.description} onChange={set("description")} />
        </Field>
        {!editing && (
          <Field
            label={t("Fotos")}
            hint={photos.length ? t("{length} {v}. Las del iPhone se convierten solas.", { length: photos.length, v: photos.length === 1 ? "foto elegida" : "fotos elegidas" }) : t("Puedes elegir varias. Luego podrás ordenarlas y añadir más.")}
            className="sm:col-span-2"
          >
            <Input type="file" accept="image/*,.heic,.heif" multiple className="py-1.5" onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} />
          </Field>
        )}
        <Field label={t("Notas internas")} className="sm:col-span-2">
          <Textarea value={v.notes} onChange={set("notes")} className="min-h-12" />
        </Field>
      </div>

      {!editing && (
        <div>
          <p className="text-[13px] font-semibold text-ink-soft">{t("Variantes")}</p>
          <p className="mb-2 text-xs text-muted">{t("Por ejemplo colores o tallas. Si no tiene, se crea una variante «Única».")}</p>
          <div className="flex flex-col gap-2">
            {variants.map((name, i) => (
              <div key={i} className="flex gap-2">
                <Input value={name} onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? e.target.value : x)))} placeholder={t("Variante {v}", { v: i + 1 })} />
                <Button variant="ghost" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>
                  {t("Quitar")}
                </Button>
              </div>
            ))}
            <Button size="sm" className="self-start" onClick={() => setVariants((vs) => [...vs, ""])}>
              {t("Añadir variante")}
            </Button>
          </div>
        </div>
      )}

      <Notice tone="info">{t("El stock no se escribe aquí: entra al recibir una compra o con un ajuste autorizado en Salidas y ajustes.")}</Notice>
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="flex gap-2">
        <Button variant="primary" onClick={save} disabled={pending || !v.name.trim()}>
          {pending ? (progress ?? t("Guardando…")) : editing ? t("Guardar cambios") : t("Crear producto")}
        </Button>
      </div>
    </div>
  );
}
