"use client";
import { useT } from "@/i18n/client";
import { useActionState } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { recover, type RecoverState } from "./actions";

export function RecoverForm() {
  const t = useT();
  const [state, action, pending] = useActionState<RecoverState, FormData>(recover, { error: null });
  if (state.sent) {
    return <Notice tone="good" title={t("Revisa tu correo")}>{t("Si hay una cuenta con ese email, te llegará un enlace para elegir una contraseña nueva.")}</Notice>;
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t("Email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? t("Enviando…") : t("Enviar enlace")}
      </Button>
    </form>
  );
}
