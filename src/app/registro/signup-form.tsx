"use client";
import { useT } from "@/i18n/client";
import { rich } from "@/i18n/rich";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { signup, type SignupState } from "./actions";

export function SignupForm({ next, invitedEmail }: { next: string; invitedEmail?: string }) {
  const t = useT();
  const router = useRouter();
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, { error: null, email: invitedEmail ?? "" });
  useEffect(() => {
    if (state.sent === false && !state.error && state.next) router.replace(state.next);
  }, [state, router]);

  if (state.sent) {
    return (
      <Notice tone="good" title={t("Revisa tu correo")}>
        {rich(t("Te hemos enviado un enlace a <b>{email}</b> para confirmar tu cuenta. Ábrelo desde este dispositivo para continuar. Si no llega en unos minutos, mira en «Spam».", { email: state.email }), { b: (c) => <strong>{c}</strong> })}
      </Notice>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label={t("Tu nombre")} htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </Field>
      <Field label={t("Email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email ?? invitedEmail} readOnly={!!invitedEmail} />
      </Field>
      <Field label={t("Contraseña")} htmlFor="password" hint={t("Mínimo 8 caracteres.")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {!invitedEmail && (
        <Field label={t("Nombre de tu negocio (opcional)")} htmlFor="business">
          <Input id="business" name="business" maxLength={80} />
        </Field>
      )}
      <label className="flex items-start gap-2.5 text-[13.5px]">
        <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 accent-[var(--color-brand)]" />
        <span>
          {rich(t("Acepto las <a>condiciones</a> y la <b>política de privacidad</b>."), {
            a: (c) => (
              <Link href="/terminos" className="font-semibold underline" target="_blank">
                {c}
              </Link>
            ),
            b: (c) => (
              <Link href="/privacidad" className="font-semibold underline" target="_blank">
                {c}
              </Link>
            ),
          })}
        </span>
      </label>
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? t("Creando la cuenta…") : invitedEmail ? t("Crear cuenta y unirme") : t("Empezar la prueba gratis")}
      </Button>
    </form>
  );
}
