"use client";
import { useT } from "@/i18n/client";
import { useActionState } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { setNewPassword, type NewPasswordState } from "./actions";

export function NewPasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, { error: null });
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t("Nueva contraseña")} htmlFor="password" hint={t("Mínimo 8 caracteres.")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label={t("Repite la contraseña")} htmlFor="repeat">
        <Input id="repeat" name="repeat" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? t("Guardando…") : t("Guardar contraseña")}
      </Button>
    </form>
  );
}
