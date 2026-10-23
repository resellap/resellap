"use client";
import { useT } from "@/i18n/client";
import { RotateCcw } from "lucide-react";
import { ConfirmAction } from "@/components/ui-client";
import { resetPreferences } from "./actions";

export function ResetAllButton() {
  const t = useT();
  return (
    <ConfirmAction
      label={
        <>
          <RotateCcw size={16} />{" "}{t("Restablecer todos mis ajustes")}
        </>
      }
      title={t("Restablecer ajustes")}
      description={t("Tu panel, aspecto, tablas, avisos y preferencias volverán a la configuración inicial. Tus datos del negocio no se tocan.")}
      confirmLabel={t("Restablecer")}
      variant="secondary"
      action={() => resetPreferences()}
      onDone={() => location.reload()}
    />
  );
}
