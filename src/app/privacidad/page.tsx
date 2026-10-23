import { getT, tSync } from "@/i18n/server";
import type { Metadata } from "next";
import { LegalPage } from "@/components/public-layout";
import { LEGAL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Privacidad") };
}

export default function PrivacyPage() {
  const t = tSync();
  return (
    <LegalPage title={t("Privacidad")} updated="12 de octubre de 2026">
      <h2>{t("Responsable")}</h2>
      <p>
        {LEGAL.name} ({LEGAL.taxId}), {LEGAL.address}{t(". Contacto: {email}.", { email: LEGAL.email })}
      </p>
      <h2>{t("Qué datos tratamos")}</h2>
      <ul>
        <li>{t("Cuenta: nombre, email y contraseña (guardada cifrada por el proveedor de autenticación).")}</li>
        <li>{t("Datos de tu negocio que introduces: productos, compras, ventas, envíos, proveedores y archivos.")}</li>
        <li>{t("Facturación: la gestiona Stripe. Nosotros no vemos ni guardamos los datos de tu tarjeta.")}</li>
        <li>{t("Registros técnicos y de auditoría para seguridad (quién hizo qué cambio y cuándo).")}</li>
      </ul>
      <h2>{t("Para qué y con qué base")}</h2>
      <ul>
        <li>{t("Prestar el servicio contratado (ejecución del contrato).")}</li>
        <li>{t("Cobrar la suscripción y cumplir obligaciones fiscales (obligación legal).")}</li>
        <li>{t("Seguridad y prevención de abusos (interés legítimo).")}</li>
      </ul>
      <h2>{t("Aislamiento y acceso")}</h2>
      <p>
        {t("Los datos de cada organización están separados en la base de datos: ningún otro cliente puede verlos. El personal de la plataforma solo ve datos agregados (número de cuentas, estado de las suscripciones), no el contenido de tu negocio. No existe acceso oculto a tu cuenta.")}
      </p>
      <h2>{t("Encargados del tratamiento")}</h2>
      <ul>
        <li>{t("Supabase (base de datos, autenticación y archivos).")}</li>
        <li>{t("Vercel (alojamiento de la aplicación).")}</li>
        <li>{t("Stripe (pagos).")}</li>
        <li>{t("Proveedor de envío de correos (verificación de email e invitaciones).")}</li>
        <li>{t("Si conectas tu correo o usas la generación de textos, Google (Gmail y Gemini) para esas funciones.")}</li>
      </ul>
      <h2>{t("Conservación")}</h2>
      <p>
        {t("Mientras tengas cuenta. Si cancelas la suscripción tus datos no se borran: puedes exportarlos. Si pides eliminar tu organización, se borra de forma definitiva a partir de 30 días después de la solicitud, salvo los datos de facturación que la ley obliga a conservar.")}
      </p>
      <h2>{t("Tus derechos")}</h2>
      <p>
        {t("Puedes acceder, rectificar, exportar, limitar u oponerte al tratamiento, y pedir la supresión escribiendo a {email}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).", { email: LEGAL.email })}
      </p>
    </LegalPage>
  );
}
