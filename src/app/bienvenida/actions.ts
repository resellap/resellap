"use server";
import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type CreateOrgState = { error: string | null };

export async function createOrganization(_prev: CreateOrgState, formData: FormData): Promise<CreateOrgState> {
  const t = await getT();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: t("El nombre debe tener entre 2 y 80 caracteres.") };
  const supabase = await createClient();
  // Las listas iniciales (plataformas y transportistas) se crean en el idioma de la app
  const { error } = await supabase.rpc("create_organization", { p_name: name });
  if (error) return { error: friendlyError(error) };
  await welcomeEmails(name);
  redirect("/");
}

/** Correo de bienvenida al nuevo cliente y aviso al dueño de Resellap. Nunca bloquea. */
async function welcomeEmails(orgName: string) {
  try {
    const t = await getT();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    const { ownerEmail, sendTemplate } = await import("@/lib/mailer/send");
    const { ownerNotice, welcome } = await import("@/lib/mailer/templates");
    const { TRIAL_DAYS } = await import("@/lib/site");
    const name = (user.user_metadata?.full_name as string | undefined) ?? null;
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
    await sendTemplate(user.email, t.locale, welcome, { name, orgName, trialEnd });
    const owner = ownerEmail();
    if (owner)
      await sendTemplate(owner, "es", ownerNotice, {
        title: `Nuevo cliente: ${orgName}`,
        lines: ["Se acaba de crear un espacio nuevo en Resellap. Empieza su prueba gratuita."],
        facts: [["Negocio", orgName], ["Persona", name ?? "—"], ["Correo", user.email], ["Idioma", t.locale]],
      });
  } catch (e) {
    console.error("Bienvenida:", (e as Error)?.message);
  }
}
