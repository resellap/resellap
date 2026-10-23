"use server";
import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getT();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!email || !password) return { error: t("Escribe tu email y tu contraseña."), email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /invalid login credentials/i.test(error.message)
      ? "El email o la contraseña no son correctos."
      : /email not confirmed/i.test(error.message)
        ? "Tu email aún no está confirmado. Abre el enlace que te enviamos al registrarte."
        : "No se ha podido iniciar sesión. Inténtalo de nuevo.";
    return { error: msg, email };
  }
  const { data } = await supabase.auth.getClaims();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active")
    .eq("id", data?.claims?.sub ?? "")
    .maybeSingle();
  if (profileError) {
    await supabase.auth.signOut();
    return {
      error: t("Has entrado, pero no se puede leer tu perfil en la base de datos. Revisa la conexión con Supabase y que las migraciones estén aplicadas."),
      email,
    };
  }
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: t("Tu usuario está desactivado. Habla con el administrador."), email };
  }
  redirect(safeNext(next));
}
