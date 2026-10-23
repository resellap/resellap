import { getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";
import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isGeneratorConfigured } from "./actions";
import { DescriptionGenerator } from "./generator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Generador de descripciones") };
}

export default async function DescriptionsPage() {
  const t = await getT();
  const user = await requireUser();
  if (!can(user, "generador")) redirect("/?aviso=sin-permiso");
  // Solo se comprueba si existe la clave; no se llama a la IA al abrir la pantalla
  const configured = await isGeneratorConfigured();
  return (
    <>
      <PageHeader
        title={t("Generador de descripciones")}
        description={t("Elige productos de tu inventario y crea el texto del anuncio para Wallapop, Vinted, eBay o Instagram. Solo lee tus productos: no cambia stock ni fichas.")}
      />
      {!configured && (
        <Notice tone="warn" className="mb-4" title={t("Falta la clave de la IA (GEMINI_API_KEY)")}>
          <p>{t("Puedes preparar el anuncio, pero para generarlo hace falta una clave gratuita de Google Gemini:")}</p>
          <ol className="mt-1 list-decimal pl-5">
            <li>{rich(t("Entra en <b>aistudio.google.com</b> con tu cuenta de Google → <b>Get API key</b> → <b>Create API key</b> y cópiala."), { b: (c) => <strong>{c}</strong> })}</li>
            <li>
              {rich(t("En <b>Vercel</b> → proyecto Resellap → <b>Settings → Environment Variables</b>: nombre <c>GEMINI_API_KEY</c>, valor la clave."), {
                b: (c) => <strong>{c}</strong>,
                c: (c) => <code>{c}</code>,
              })}
            </li>
            <li>{rich(t("<b>Deployments</b> → el último → <b>Redeploy</b>."), { b: (c) => <strong>{c}</strong> })}</li>
          </ol>
        </Notice>
      )}
      <DescriptionGenerator configured={configured} />
    </>
  );
}
