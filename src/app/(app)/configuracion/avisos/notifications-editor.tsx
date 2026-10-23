"use client";
import { useT } from "@/i18n/client";
import { useMemo, useState } from "react";
import { Field, Input, Panel } from "@/components/ui";
import { useServerAction } from "@/components/ui-client";
import { DEFAULT_PREFS, type Prefs } from "@/lib/preferences";
import { resetPreferences, savePreferences } from "../actions";
import { SaveBar, Toggle } from "../settings-ui";

type N = Prefs["notifications"];

export function NotificationsEditor({ initial, admin }: { initial: N; admin: boolean }) {
  const t = useT();
  const [saved, setSaved] = useState<N>(initial);
  const [n, setN] = useState<N>(initial);
  const { run, pending, error, message } = useServerAction(savePreferences<"notifications">);
  const dirty = useMemo(() => JSON.stringify(n) !== JSON.stringify(saved), [n, saved]);
  const set = (k: keyof N) => (v: boolean) => setN({ ...n, [k]: v });

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t("Qué quieres que te avise")}>
        <div className="-my-1 divide-y divide-line">
          <Toggle checked={n.shipments} onChange={set("shipments")} label={t("Ventas pendientes de envío")} description={t("Paquetes que aún no has marcado como enviados.")} />
          {admin && (
            <>
              <Toggle checked={n.detected} onChange={set("detected")} label={t("Ventas por confirmar")} description={t("Ventas que han llegado por correo y esperan tu confirmación.")} />
              <Toggle checked={n.emails} onChange={set("emails")} label={t("Correos que requieren atención")} description={t("Correos de ventas que la app no ha podido procesar sola.")} />
              <Toggle checked={n.listings} onChange={set("listings")} label={t("Anuncios por quitar")} description={t("Productos sin stock que siguen publicados.")} />
              <Toggle checked={n.imports} onChange={set("imports")} label={t("Problemas de importación")} description={t("Filas del Excel que quedaron pendientes de revisar.")} />
              <Toggle checked={n.lowStock} onChange={set("lowStock")} label={t("Stock bajo")} description={t("Productos a los que les quedan pocas unidades.")} />
              {n.lowStock && (
                <Field label={t("Avisar cuando queden como mucho (unidades)")} className="py-3">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    inputMode="numeric"
                    value={n.lowStockThreshold}
                    onChange={(e) => setN({ ...n, lowStockThreshold: Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))) })}
                    className="max-w-32"
                  />
                </Field>
              )}
            </>
          )}
        </div>
      </Panel>
      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={async () => {
          const r = await run("notifications", { ...n });
          if (r.ok) setSaved(n);
        }}
        onDiscard={() => setN(saved)}
        error={error}
        message={message}
        reset={{
          label: t("Avisos iniciales"),
          description: t("Todos los avisos activados salvo el de stock bajo."),
          action: () => resetPreferences("notifications"),
          onDone: () => {
            setN(DEFAULT_PREFS.notifications);
            setSaved(DEFAULT_PREFS.notifications);
          },
        }}
      />
    </div>
  );
}
