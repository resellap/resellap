import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isGeneratorConfigured } from "./actions";
import { DescriptionGenerator } from "./generator";

export const metadata: Metadata = { title: msg("Generador de descripciones") };

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
            <li>
              {t("Entra en")}{" "}<strong>{t("aistudio.google.com")}</strong>{" "}{t("con tu cuenta de Google →")}{" "}<strong>{t("Get API key")}</strong> → <strong>{t("Create API key")}</strong>{" "}{t("y cópiala.")}
            </li>
            <li>
              {t("En")}{" "}<strong>{t("Vercel")}</strong>{" "}{t("→ proyecto Resellap →")}{" "}<strong>{t("Settings → Environment Variables")}</strong>{t(": nombre")}{" "}<code>{t("GEMINI_API_KEY")}</code>{t(", valor la clave.")}
            </li>
            <li>
              <strong>{t("Deployments")}</strong>{" "}{t("→ el último →")}{" "}<strong>{t("Redeploy")}</strong>.
            </li>
          </ol>
        </Notice>
      )}
      <DescriptionGenerator configured={configured} />
    </>
  );
}
