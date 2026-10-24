import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui";
import { mailConfigured, ownerEmail } from "@/lib/mailer/send";
import type { SampleId } from "./actions";
import { TestEmails } from "./test-ui";

export const metadata: Metadata = { title: "Correos" };

const ITEMS: { id: SampleId; label: string; when: string }[] = [
  { id: "welcome", label: "Bienvenida", when: "Al crear su espacio" },
  { id: "invitation", label: "Invitación al equipo", when: "Cuando un administrador invita a alguien" },
  { id: "supportReceived", label: "Consulta recibida", when: "Cuando su duda pasa a soporte" },
  { id: "supportReply", label: "Respuesta de soporte", when: "Cuando respondes desde Soporte y feedback" },
  { id: "trialEnding", label: "Quedan 2 días de prueba", when: "Cada día a las 10:00, a quien le quedan 2 días" },
  { id: "trialEnded", label: "Prueba terminada", when: "El día después de terminar la prueba sin suscribirse" },
  { id: "subscriptionActive", label: "Suscripción activada", when: "Al pagar la suscripción" },
  { id: "paymentFailed", label: "Pago fallido", when: "Cuando Stripe no puede cobrar" },
  { id: "subscriptionCanceled", label: "Suscripción cancelada", when: "Cuando termina la suscripción" },
  { id: "deletionRequested", label: "Eliminación solicitada", when: "Al pedir borrar el espacio" },
  { id: "confirmSignup", label: "Confirmar correo", when: "Al registrarse (con el gancho de Supabase activo)" },
  { id: "recovery", label: "Recuperar contraseña", when: "Al pedir una contraseña nueva" },
  { id: "magicLink", label: "Enlace para entrar", when: "Entrar sin contraseña" },
  { id: "reauthCode", label: "Código de verificación", when: "Al confirmar una acción sensible" },
];

export default function EmailsPage() {
  const ready = mailConfigured();
  return (
    <>
      <PageHeader title="Correos" description={`Los correos automáticos de Resellap. Las pruebas llegan a ${ownerEmail() ?? "tu correo"}.`} />
      {!ready && <Notice tone="bad" className="mb-4">El envío no está configurado: falta RESEND_API_KEY o MAIL_FROM en Vercel.</Notice>}
      <TestEmails items={ITEMS} />
    </>
  );
}
