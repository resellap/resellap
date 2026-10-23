"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { ConfirmAction, Modal, useServerAction, ActionMessages } from "@/components/ui-client";
import { cancelDeletionAction, requestDeletionAction } from "./actions";

export function RequestDeletion({ orgName }: { orgName: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { run, pending, error } = useServerAction(requestDeletionAction);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t("Solicitar eliminación")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("Eliminar el espacio y sus datos")}
        footer={
          <>
            <Button onClick={() => setOpen(false)} disabled={pending}>
              {t("Volver")}
            </Button>
            <Button
              variant="danger"
              disabled={pending || name.trim() !== orgName}
              onClick={async () => {
                const r = await run(name);
                if (r.ok) setOpen(false);
              }}
            >
              {pending ? t("Guardando…") : t("Solicitar eliminación")}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-ink-soft">
          <p>{t("El espacio pasará a solo lectura. Durante 30 días podrás exportar tus datos y anular la solicitud.")}</p>
          <p>{t("Pasado ese plazo, se borrarán de forma definitiva todos los productos, ventas, compras, archivos y el equipo. No se puede deshacer.")}</p>
          <p>{t("Esto no cancela la suscripción de Stripe: cancélala en «Gestionar pago» para que no se te cobre más.")}</p>
        </div>
        <Field label={t("Escribe «{orgName}» para confirmar", { orgName })} className="mt-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <ActionMessages error={error} />
      </Modal>
    </>
  );
}

export function CancelDeletion() {
  const t = useT();
  return (
    <ConfirmAction
      label={t("Anular la eliminación")}
      variant="primary"
      title={t("Anular la eliminación")}
      description={t("El espacio vuelve a estar activo y no se borrará nada.")}
      confirmLabel={t("Anular")}
      action={() => cancelDeletionAction()}
    />
  );
}
