"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { ActionMessages, ConfirmAction, Modal, useServerAction } from "@/components/ui-client";
import type { Option } from "@/lib/types";
import { addTransfer, deleteTransfer } from "./actions";

export function TransferButton({ partners, today, suggestion }: { partners: Option[]; today: string; suggestion?: { from: string; to: string; amount: number } }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(suggestion?.from ?? "");
  const [to, setTo] = useState(suggestion?.to ?? "");
  const [amount, setAmount] = useState(suggestion ? String(suggestion.amount) : "");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const { run, pending, error } = useServerAction(addTransfer);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {t("Registrar pago entre socios")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("Pago entre socios")}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t("Cancelar")}</Button>
            <Button
              variant="primary"
              disabled={pending || !from || !to || !(Number(amount.replace(",", ".")) > 0)}
              onClick={async () => {
                const r = await run({ transfer_date: date, from_responsible_id: from, to_responsible_id: to, amount: Number(amount.replace(",", ".")), notes });
                if (r.ok) setOpen(false);
              }}
            >
              {t("Registrar pago")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Paga")}>
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">{t("Elige…")}</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Recibe")}>
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">{t("Elige…")}</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Importe (€)")}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("Fecha")}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t("Notas")} className="sm:col-span-2">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Por ejemplo: Bizum del reparto de septiembre")} />
          </Field>
        </div>
        <ActionMessages error={error} />
      </Modal>
    </>
  );
}

export function DeleteTransferButton({ id }: { id: string }) {
  const t = useT();
  return <ConfirmAction size="sm" label={t("Eliminar")} title={t("Eliminar pago")} description={t("El pago deja de contar en el reparto.")} confirmLabel={t("Eliminar pago")} action={() => deleteTransfer(id)} />;
}
