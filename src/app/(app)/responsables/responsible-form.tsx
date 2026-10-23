"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { ActionMessages, Modal, useServerAction } from "@/components/ui-client";
import { saveResponsible, type ResponsibleInput } from "./actions";

export function ResponsibleButton({ initial, users }: { initial?: ResponsibleInput; users: { id: string; email: string; linked: boolean }[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ResponsibleInput>(initial ?? { name: "", email: "", active: true, is_partner: false, profile_id: null });
  const { run, pending, error } = useServerAction(saveResponsible);
  return (
    <>
      {initial ? (
        <button className="text-xs font-semibold text-brand-ink hover:underline" onClick={() => setOpen(true)}>
          {t("Editar")}
        </button>
      ) : (
        <Button variant="primary" onClick={() => setOpen(true)}>
          {t("Nuevo responsable")}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={initial ? t("Editar {name}", { name: initial.name }) : t("Nuevo responsable")}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t("Cancelar")}</Button>
            <Button
              variant="primary"
              disabled={pending || !v.name.trim()}
              onClick={async () => {
                const r = await run(v);
                if (r.ok) setOpen(false);
              }}
            >
              {t("Guardar responsable")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label={t("Nombre")} required>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
          </Field>
          <Field label={t("Email de contacto")}>
            <Input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
          <Field label={t("Usuario con el que inicia sesión")} hint={t("Al vincularlo, ese usuario solo podrá registrar ventas a nombre de este responsable.")}>
            <Select value={v.profile_id ?? ""} onChange={(e) => setV({ ...v, profile_id: e.target.value || null })}>
              <option value="">{t("Sin usuario (solo histórico)")}</option>
              {users
                .filter((u) => !u.linked || u.id === initial?.profile_id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} className="h-4 w-4 accent-[var(--color-brand)]" />
            {t("Activo (aparece al registrar ventas)")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v.is_partner} onChange={(e) => setV({ ...v, is_partner: e.target.checked })} className="h-4 w-4 accent-[var(--color-brand)]" />
            {t("Socio: participa en el reparto del total entre socios")}
          </label>
        </div>
        <ActionMessages error={error} />
      </Modal>
    </>
  );
}
