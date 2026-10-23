"use client";
import { useT } from "@/i18n/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Field, Panel, Select } from "@/components/ui";
import { useServerAction } from "@/components/ui-client";
import { DEFAULT_PREFS, type Prefs } from "@/lib/preferences";
import { resetPreferences, savePreferences } from "../actions";
import { SaveBar } from "../settings-ui";

type S = Prefs["sales"];

export function SalesPrefsEditor({ initial, platforms, admin }: { initial: S; platforms: { id: string; name: string }[]; admin: boolean }) {
  const t = useT();
  const [saved, setSaved] = useState<S>(initial);
  const [s, setS] = useState<S>(initial);
  const { run, pending, error, message } = useServerAction(savePreferences<"sales">);
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(saved), [s, saved]);
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t("Nueva venta")}>
        <Field label={t("Plataforma predeterminada")} hint={t("Ya vendrá marcada al registrar una venta.")}>
          <Select value={s.defaultPlatformId ?? ""} onChange={(e) => setS({ defaultPlatformId: e.target.value || null })}>
            <option value="">{t("Ninguna (elegir cada vez)")}</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </Panel>
      {admin && (
        <Panel title={t("Inventario y productos")}>
          <p className="text-sm text-ink-soft">
            {t("El orden predeterminado de los productos y las columnas de las tablas se eligen en")}{" "}
            <Link href="/configuracion/tablas" className="font-semibold text-brand-ink underline">
              {t("Ajustes → Tablas")}
            </Link>
            .
          </p>
        </Panel>
      )}
      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={async () => {
          const r = await run("sales", { ...s });
          if (r.ok) setSaved(s);
        }}
        onDiscard={() => setS(saved)}
        error={error}
        message={message}
        reset={{
          label: t("Valores iniciales"),
          description: t("Sin plataforma predeterminada."),
          action: () => resetPreferences("sales"),
          onDone: () => {
            setS(DEFAULT_PREFS.sales);
            setSaved(DEFAULT_PREFS.sales);
          },
        }}
      />
    </div>
  );
}
