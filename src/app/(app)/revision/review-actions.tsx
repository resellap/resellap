"use client";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui";
import { ConfirmAction, useServerAction } from "@/components/ui-client";
import { resolveReview } from "./actions";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const t = useT();
  const reopen = useServerAction(resolveReview);
  if (status !== "pendiente") {
    return (
      <Button size="sm" variant="ghost" disabled={reopen.pending} onClick={() => reopen.run(id, "pendiente", "")}>
        {t("Volver a pendiente")}
      </Button>
    );
  }
  return (
    <span className="flex gap-1.5">
      <ConfirmAction
        size="sm"
        variant="primary"
        label={t("Resuelto")}
        title={t("Marcar como resuelto")}
        description={t("Anota qué has hecho (opcional), para que quede en el historial.")}
        confirmLabel={t("Marcar como resuelto")}
        optionalReason
        reasonLabel={t("Nota")}
        action={(note) => resolveReview(id, "resuelto", note)}
      />
      <ConfirmAction size="sm" variant="secondary" label={t("Descartar")} title={t("Descartar")} description={t("Se quita de la lista de pendientes.")} confirmLabel={t("Descartar")} optionalReason reasonLabel={t("Nota")} action={(note) => resolveReview(id, "descartado", note)} />
    </span>
  );
}
