"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { ActionMessages, ConfirmAction, Modal, useServerAction } from "@/components/ui-client";
// El cliente de Supabase del navegador (~66 KB) se carga solo al subir un archivo
const browserClient = async () => (await import("@/lib/supabase/client")).createClient();
import type { MobileOption, Option, PlatformOption } from "@/lib/types";
import { LabelButton, labelFileName } from "@/components/label-viewer";
import { updateSale, updateSaleItem, voidSale } from "../actions";

type Sale = {
  id: string;
  sale_date: string;
  responsible_id: string;
  platform_id: string;
  carrier_id: string | null;
  mobile_device_id: string | null;
  shipping_status: "pendiente" | "enviado" | null;
  shipping_label_path: string | null;
  external_reference: string | null;
  notes: string | null;
  requires_shipping: boolean;
};

export function ShippingEditor({ sale, carriers, labelUrl }: { sale: Sale; carriers: Option[]; labelUrl: string | null }) {
  const t = useT();
  const [status, setStatus] = useState(sale.shipping_status ?? "pendiente");
  const [carrier, setCarrier] = useState(sale.carrier_id ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const { run, pending, error, message } = useServerAction(updateSale);
  const label = useServerAction(updateSale);

  async function save() {
    await run({ id: sale.id, shipping_status: status, carrier_id: carrier || null });
  }

  /** La etiqueta se sube y se guarda en la venta en cuanto se elige: no hace falta pulsar nada más. */
  async function uploadLabel(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("La etiqueta pesa más de 10 MB.");
      setInputKey((k) => k + 1);
      return;
    }
    setUploading(true);
    const supabase = await browserClient();
    const path = `${sale.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const up = await supabase.storage.from("shipping-labels").upload(path, file, { contentType: file.type || undefined });
    if (up.error) {
      setUploading(false);
      setUploadError(`No se ha podido subir la etiqueta: ${up.error.message}`);
      setInputKey((k) => k + 1);
      return;
    }
    await label.run({ id: sale.id, shipping_label_path: path });
    setUploading(false);
    setInputKey((k) => k + 1);
  }

  const busyLabel = uploading || label.pending;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Estado del envío")}>
          <Select value={status} onChange={(e) => setStatus(e.target.value as "pendiente" | "enviado")}>
            <option value="pendiente">{t("Pendiente")}</option>
            <option value="enviado">{t("Enviado")}</option>
          </Select>
        </Field>
        <Field label={t("Empresa de transporte")}>
          <Select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            <option value="">{t("Sin indicar")}</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div>
        <Button variant="primary" onClick={save} disabled={pending}>
          {pending ? t("Guardando…") : t("Guardar envío")}
        </Button>
        <ActionMessages error={error} message={message} />
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <p className="text-[13px] font-semibold">{t("Etiqueta de envío")}</p>
        {sale.shipping_label_path ? (
          <div className="flex flex-wrap items-center gap-2">
            <LabelButton url={labelUrl} path={sale.shipping_label_path} variant="primary" />
            <span className="min-w-0 truncate text-xs text-muted">{labelFileName(sale.shipping_label_path)}</span>
          </div>
        ) : (
          <p className="text-xs text-muted">{t("Aún no hay etiqueta.")}</p>
        )}
        <Field label={sale.shipping_label_path ? t("Cambiar por otra") : t("Subir etiqueta")} hint={t("PDF o imagen, máximo 10 MB. Se guarda al elegirla.")}>
          <Input
            key={inputKey}
            type="file"
            accept="application/pdf,image/*"
            className="py-1.5"
            disabled={busyLabel}
            onChange={(e) => uploadLabel(e.target.files?.[0])}
          />
        </Field>
        {busyLabel && <p className="text-[13px] font-medium text-muted">{t("Subiendo etiqueta…")}</p>}
        {uploadError && <Notice tone="bad">{uploadError}</Notice>}
        {!busyLabel && <ActionMessages error={label.error} message={label.message} />}
      </div>
    </div>
  );
}

export function SaleHeaderEditor({
  sale,
  responsibles,
  platforms,
  mobiles,
}: {
  sale: Sale;
  responsibles: Option[];
  platforms: PlatformOption[];
  mobiles: MobileOption[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sale_date: sale.sale_date,
    responsible_id: sale.responsible_id,
    platform_id: sale.platform_id,
    mobile_device_id: sale.mobile_device_id ?? "",
    external_reference: sale.external_reference ?? "",
    notes: sale.notes ?? "",
  });
  const { run, pending, error } = useServerAction(updateSale);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("Editar datos")}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("Editar datos de la venta")}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t("Cancelar")}</Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={async () => {
                const r = await run({ id: sale.id, ...form, mobile_device_id: form.mobile_device_id || null });
                if (r.ok) setOpen(false);
              }}
            >
              {pending ? t("Guardando…") : t("Guardar cambios")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Fecha")}>
            <Input type="date" value={form.sale_date} onChange={set("sale_date")} />
          </Field>
          <Field label={t("Responsable")}>
            <Select value={form.responsible_id} onChange={set("responsible_id")}>
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Plataforma")}>
            <Select value={form.platform_id} onChange={set("platform_id")}>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Móvil utilizado")}>
            <Select value={form.mobile_device_id} onChange={set("mobile_device_id")}>
              <option value="">{t("Sin indicar")}</option>
              {mobiles.map((m) => (
                <option key={m.id} value={m.id}>
                  {t("Móvil {number}", { number: m.number })}
                  {m.name !== `Móvil ${m.number}` ? ` (${m.name})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Referencia de la venta")} className="sm:col-span-2">
            <Input value={form.external_reference} onChange={set("external_reference")} />
          </Field>
          <Field label={t("Notas")} className="sm:col-span-2">
            <Textarea value={form.notes} onChange={set("notes")} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">{t("Para cambiar productos, unidades o lote, anula la venta y regístrala de nuevo: así el stock queda bien.")}</p>
        <ActionMessages error={error} />
      </Modal>
    </>
  );
}

export function LinePriceEditor({ itemId, price, notes }: { itemId: string; price: number; notes: string | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(String(price));
  const [n, setN] = useState(notes ?? "");
  const { run, pending, error } = useServerAction(updateSaleItem);
  return (
    <>
      <button className="text-xs font-semibold text-brand-ink hover:underline" onClick={() => setOpen(true)}>
        {t("Editar")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("Editar línea")}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t("Cancelar")}</Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={async () => {
                const r = await run({ id: itemId, unit_price: Number(p.replace(",", ".")), notes: n || null });
                if (r.ok) setOpen(false);
              }}
            >
              {t("Guardar")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label={t("Precio por unidad (€)")}>
            <Input inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} />
          </Field>
          <Field label={t("Detalle")}>
            <Input value={n} onChange={(e) => setN(e.target.value)} />
          </Field>
        </div>
        <ActionMessages error={error} />
      </Modal>
    </>
  );
}

export function VoidSaleButton({ saleId, saleNumber }: { saleId: string; saleNumber: string }) {
  const t = useT();
  return (
    <ConfirmAction
      label={t("Anular venta")}
      title={t("Anular la venta {saleNumber}", { saleNumber })}
      description={t("Las unidades vuelven a su pedido/lote. La venta no se borra: queda anulada en el historial.")}
      confirmLabel={t("Anular venta")}
      requireReason
      reasonLabel="Motivo de la anulación"
      action={(reason) => voidSale(saleId, reason)}
    />
  );
}
