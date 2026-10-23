import { msg } from "@/i18n/translate";
import { tSync } from "@/i18n/server";
import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { LegalPage } from "@/components/public-layout";

export const metadata: Metadata = { title: msg("Términos y condiciones") };

const SUPPORT_EMAIL = "soporte@resellap.com";

type Block = { h: string } | { p: string } | { ul: string[] };

/** Texto íntegro de los Términos y Condiciones. **negrita** y saltos de línea se respetan. */
const BLOCKS: Block[] = [
  { h: "1. Identificación del prestador" },
  {
    p: "Estos Términos y Condiciones regulan el acceso y utilización de la plataforma digital denominada **Resellap** y de los servicios ofrecidos a través de ella.",
  },
  { p: "Actualmente, el servicio es prestado por una **persona física establecida en España**, titular y responsable de la explotación de Resellap." },
  {
    p: "Los datos identificativos completos del prestador, incluyendo nombre y apellidos, domicilio a efectos legales y demás información legalmente exigible, serán incorporados y actualizados en esta sección antes del inicio de la comercialización efectiva del servicio, de conformidad con la normativa aplicable.",
  },
  { p: "**Correo electrónico de contacto y soporte:** soporte@resellap.com" },
  {
    p: "Resellap es un software de tipo **SaaS (Software as a Service)** destinado a ayudar a los usuarios a organizar y gestionar información relacionada con sus actividades de compraventa y negocios, incluyendo, entre otras funcionalidades, la gestión de productos, compras, ventas, devoluciones, costes, beneficios y otra información introducida por el propio usuario.",
  },
  { h: "2. Definiciones" },
  { p: "A efectos de estos Términos:" },
  {
    p: '**"Resellap"** hace referencia a la plataforma, software, aplicación, sitio web, funcionalidades, servicios y contenidos puestos a disposición por el prestador.',
  },
  { p: '**"Usuario"** hace referencia a cualquier persona que cree una cuenta, acceda o utilice Resellap.' },
  { p: '**"Cuenta"** hace referencia al perfil creado por el Usuario para acceder al servicio.' },
  {
    p: '**"Contenido del Usuario"** hace referencia a cualquier información, dato, texto, imagen, archivo, registro, producto, venta, compra, precio, coste, devolución o cualquier otro contenido introducido, cargado, generado o almacenado por el Usuario.',
  },
  {
    p: '**"Plataformas Externas"** hace referencia a terceros servicios, marketplaces, plataformas de comercio electrónico, aplicaciones o sitios web que el Usuario pueda utilizar conjuntamente con Resellap.',
  },
  { p: '**"Servicio"** hace referencia a las funcionalidades proporcionadas por Resellap mediante el modelo SaaS.' },
  { h: "3. Objeto del servicio" },
  { p: "Resellap proporciona una herramienta tecnológica destinada a facilitar la organización y gestión de actividades de compraventa y negocios." },
  { p: "Entre sus funcionalidades pueden encontrarse:" },
  {
    ul: [
      "Registro y organización de productos.",
      "Registro de compras.",
      "Registro de ventas.",
      "Registro de devoluciones.",
      "Control de costes.",
      "Cálculo y organización de beneficios.",
      "Gestión de información relacionada con operaciones.",
      "Automatización o importación de determinada información.",
      "Herramientas destinadas a facilitar la gestión de la actividad del Usuario.",
      "Otras funcionalidades que puedan incorporarse posteriormente.",
    ],
  },
  { p: "Las funcionalidades concretas disponibles podrán modificarse, ampliarse, reducirse o sustituirse con el tiempo." },
  { p: "Resellap **no constituye una asesoría profesional**, financiera, fiscal, contable, jurídica, empresarial ni de inversión." },
  { p: "La información, cálculos, indicadores o resultados proporcionados por el software tienen carácter meramente informativo y de gestión." },
  { p: "El Usuario será en todo momento responsable de verificar la información utilizada para tomar decisiones relacionadas con su actividad." },
  { h: "4. Ausencia de asesoramiento" },
  { p: "Resellap no proporciona asesoramiento personalizado al Usuario." },
  { p: "En particular, Resellap no garantiza:" },
  {
    ul: [
      "Que una determinada estrategia comercial vaya a generar beneficios.",
      "Que un producto vaya a venderse.",
      "Que una determinada compra sea rentable.",
      "Que una actividad comercial cumpla las obligaciones fiscales del Usuario.",
      "Que una operación sea jurídicamente válida.",
      "Que una determinada plataforma externa permita realizar una operación.",
      "Que el Usuario obtenga determinados ingresos.",
    ],
  },
  { p: "Cualquier cálculo efectuado por el software dependerá de los datos introducidos o recibidos mediante los mecanismos disponibles." },
  {
    p: "El Usuario debe realizar las comprobaciones que considere necesarias antes de utilizar dichos datos para tomar decisiones económicas, fiscales, comerciales o de cualquier otra naturaleza.",
  },
  { h: "5. Plataformas de terceros" },
  { p: "Resellap puede permitir al Usuario organizar o incorporar información relacionada con plataformas externas de compraventa." },
  { p: "Estas plataformas son independientes de Resellap." },
  {
    p: "Resellap **no es propietaria, operadora, representante, agente, distribuidora ni afiliada**, salvo indicación expresa, de ninguna plataforma externa.",
  },
  {
    p: "Las marcas, nombres comerciales, logotipos y demás derechos de propiedad intelectual pertenecientes a terceros corresponden exclusivamente a sus respectivos titulares.",
  },
  {
    p: "El uso de nombres o referencias a plataformas externas dentro de Resellap tiene exclusivamente una finalidad funcional, informativa o de compatibilidad.",
  },
  { h: "6. Importación y recepción de información" },
  {
    p: "Cuando Resellap permita importar información procedente de una plataforma externa, dicha información podrá obtenerse mediante mecanismos como correos electrónicos de confirmación de operaciones u otros medios técnicos disponibles.",
  },
  {
    p: "Estas funcionalidades no implican necesariamente la existencia de una integración oficial, API oficial, asociación comercial o autorización por parte de la plataforma externa.",
  },
  {
    p: "El Usuario autoriza a Resellap a procesar la información que éste facilite o permita recibir con la finalidad de proporcionar las funcionalidades contratadas.",
  },
  {
    p: "El Usuario será responsable de asegurarse de que dispone de los derechos y autorizaciones necesarios para utilizar dichos mecanismos con sus cuentas y datos.",
  },
  { h: "7. Responsabilidad sobre plataformas externas" },
  { p: "Resellap no controla las plataformas externas." },
  { p: "Por tanto, no será responsable de:" },
  {
    ul: [
      "Bloqueos de cuentas.",
      "Suspensiones.",
      "Cancelaciones de cuentas.",
      "Restricciones comerciales.",
      "Cambios en las políticas de terceros.",
      "Cambios en sistemas de terceros.",
      "Eliminación de anuncios.",
      "Eliminación de publicaciones.",
      "Retenciones de fondos.",
      "Cancelaciones de operaciones.",
      "Disputas entre compradores y vendedores.",
      "Fraudes cometidos por terceros.",
      "Pérdidas económicas ocasionadas por actuaciones de plataformas externas.",
      "Fallos, modificaciones o interrupciones de servicios externos.",
    ],
  },
  { p: "El Usuario utilizará las plataformas externas bajo sus propios términos y condiciones y deberá cumplir las normas de cada una de ellas." },
  { h: "8. Responsabilidad del usuario sobre su actividad" },
  { p: "El Usuario es el único responsable de la actividad que realice utilizando Resellap." },
  { p: "Esto incluye, entre otros:" },
  {
    ul: [
      "Los productos que compre.",
      "Los productos que venda.",
      "Los precios establecidos.",
      "Las descripciones utilizadas.",
      "La autenticidad de los productos.",
      "La legalidad de sus operaciones.",
      "La procedencia de los productos.",
      "Las obligaciones fiscales que correspondan.",
      "Las obligaciones contables que correspondan.",
      "Las obligaciones frente a consumidores.",
      "El cumplimiento de las condiciones de las plataformas externas.",
      "Los datos introducidos en Resellap.",
    ],
  },
  { p: "Resellap proporciona una herramienta tecnológica de gestión y no participa en las operaciones comerciales realizadas por el Usuario." },
  { h: "9. Prohibiciones de uso" },
  { p: "El Usuario no podrá utilizar Resellap para actividades ilegales o fraudulentas." },
  { p: "Queda prohibido utilizar el servicio para:" },
  {
    ul: [
      "Cometer actividades ilícitas.",
      "Facilitar actividades fraudulentas.",
      "Distribuir contenido ilegal.",
      "Intentar obtener acceso no autorizado a sistemas.",
      "Interferir deliberadamente en el funcionamiento de Resellap.",
      "Introducir código malicioso.",
      "Intentar vulnerar los sistemas de seguridad.",
      "Utilizar el servicio para perjudicar a terceros.",
      "Suplantar la identidad de otras personas.",
      "Utilizar Resellap para actividades contrarias a la legislación aplicable.",
    ],
  },
  {
    p: "Resellap podrá adoptar las medidas razonables necesarias cuando detecte un uso que pueda comprometer la seguridad, funcionamiento o legalidad del servicio.",
  },
  { h: "10. Creación de cuenta" },
  { p: "Para utilizar determinadas funcionalidades será necesario crear una cuenta." },
  { p: "El Usuario deberá proporcionar información veraz, actualizada y suficiente para la creación y mantenimiento de la cuenta." },
  { p: "El Usuario será responsable de mantener actualizada dicha información." },
  { p: "Cada Usuario deberá mantener sus credenciales de acceso bajo medidas razonables de seguridad." },
  { h: "11. Uso compartido de la cuenta" },
  { p: "Resellap permite al Usuario compartir sus credenciales de acceso con otras personas bajo su propia responsabilidad." },
  { p: "El Usuario será responsable de las actuaciones realizadas desde su cuenta." },
  {
    p: "Resellap no será responsable de los daños derivados del uso compartido de credenciales cuando éstos sean consecuencia de decisiones o actuaciones del propio Usuario o de las personas a quienes haya facilitado voluntariamente el acceso.",
  },
  { p: "El Usuario deberá adoptar medidas razonables para evitar accesos no autorizados." },
  { h: "12. Seguridad de la cuenta" },
  { p: "El Usuario deberá mantener la confidencialidad de sus credenciales." },
  { p: "Si sospecha que un tercero ha obtenido acceso no autorizado a su cuenta, deberá comunicarlo a Resellap mediante el correo:" },
  { p: "**soporte@resellap.com**" },
  { p: "Resellap podrá solicitar información adicional para verificar la titularidad de la cuenta antes de realizar determinadas actuaciones." },
  { h: "13. Precio del servicio" },
  { p: "Actualmente Resellap ofrece un único plan de suscripción:" },
  { p: "**4,99 € al mes.**" },
  {
    p: "Los precios mostrados durante el proceso de contratación serán los aplicables en el momento de contratar, sin perjuicio de las modificaciones futuras comunicadas conforme a la normativa aplicable.",
  },
  { p: "Los impuestos que legalmente correspondan serán aplicados según la situación fiscal del Usuario y del prestador." },
  { h: "14. Prueba gratuita" },
  { p: "Resellap ofrece inicialmente un período de prueba gratuito de **7 días**." },
  { p: "Durante el período de prueba el Usuario podrá utilizar el servicio conforme a las funcionalidades disponibles en cada momento." },
  { p: "La prueba gratuita no garantiza que todas las funcionalidades futuras estén disponibles durante dicho período." },
  { p: "El Usuario podrá cancelar la suscripción durante el período de prueba." },
  { h: "15. Renovación automática" },
  {
    p: "Una vez finalizado el período de prueba gratuito, la suscripción se renovará automáticamente por períodos mensuales, salvo que el Usuario la cancele previamente.",
  },
  { p: "El importe aplicable será el correspondiente al plan contratado en ese momento." },
  { p: "La renovación se realizará mediante el sistema de pago habilitado por Resellap." },
  { p: "El Usuario acepta expresamente la renovación automática al contratar la suscripción." },
  { h: "16. Pagos" },
  { p: "Los pagos serán procesados mediante **Stripe** o los proveedores de servicios de pago que Resellap utilice en cada momento." },
  {
    p: "Resellap no almacena directamente los datos completos de las tarjetas bancarias cuando el procesamiento sea realizado por el proveedor de pagos correspondiente.",
  },
  { p: "El Usuario deberá proporcionar los datos necesarios para completar el proceso de pago al proveedor de servicios correspondiente." },
  { p: "Los pagos podrán estar sujetos a las condiciones y políticas del proveedor de pago." },
  { h: "17. Cancelación de la suscripción" },
  { p: "El Usuario podrá cancelar su suscripción en cualquier momento." },
  { p: "La cancelación podrá realizarse incluso durante el período de prueba gratuito." },
  { p: "Cuando se cancele una suscripción ya iniciada, la cancelación impedirá la siguiente renovación automática." },
  { p: "Salvo que legalmente corresponda otra cosa, la cancelación no supondrá necesariamente el reembolso de períodos ya iniciados." },
  { p: "El Usuario mantendrá el acceso al servicio hasta la finalización del período de facturación correspondiente." },
  { h: "18. Finalización del período contratado" },
  { p: "Una vez finalizado el período contratado, el acceso a determinadas funcionalidades podrá quedar restringido." },
  { p: "Resellap podrá permitir al Usuario acceder a sus datos almacenados con el objetivo de exportarlos." },
  { p: "Durante este período restringido, el Usuario podrá no disponer de la posibilidad de:" },
  {
    ul: [
      "Crear nuevos registros.",
      "Modificar registros existentes.",
      "Añadir nuevas ventas.",
      "Añadir nuevas compras.",
      "Utilizar determinadas funcionalidades premium.",
    ],
  },
  { p: "La finalidad de este acceso será facilitar la recuperación y exportación de la información del Usuario." },
  { h: "19. Datos del usuario" },
  { p: "El Usuario conserva sus derechos sobre los datos y contenidos que introduzca en Resellap." },
  {
    p: "Resellap tratará dichos datos exclusivamente en la medida necesaria para proporcionar el servicio, mantener la seguridad, cumplir obligaciones legales y realizar las operaciones necesarias para el funcionamiento de la plataforma.",
  },
  {
    p: "Resellap no utilizará los datos privados de las cuentas para examinar qué productos concretos vende o compra cada Usuario con fines comerciales propios.",
  },
  { p: "El tratamiento de datos personales se desarrollará conforme a la Política de Privacidad de Resellap." },
  { h: "20. Seguridad y confidencialidad" },
  {
    p: "Resellap aplicará medidas técnicas y organizativas razonables destinadas a proteger la información almacenada frente a accesos no autorizados, pérdida, destrucción o alteración.",
  },
  { p: "La información almacenada podrá estar protegida mediante mecanismos de cifrado y controles de acceso." },
  { p: "No obstante, ningún sistema conectado a Internet puede garantizar una seguridad absoluta." },
  { p: "Por ello, Resellap no garantiza que el servicio esté completamente libre de vulnerabilidades, ataques, interrupciones o accesos ilícitos." },
  { h: "21. Acceso del prestador a los datos" },
  { p: "Resellap está diseñado para minimizar el acceso humano a los datos privados almacenados por los Usuarios." },
  { p: "El prestador no accederá deliberadamente al contenido privado de las cuentas para conocer qué productos compra o vende cada Usuario." },
  { p: "No obstante, podrán producirse accesos técnicos estrictamente necesarios para:" },
  {
    ul: [
      "Mantener el funcionamiento del servicio.",
      "Resolver incidencias técnicas.",
      "Garantizar la seguridad.",
      "Detectar abusos.",
      "Prevenir fraude.",
      "Cumplir obligaciones legales.",
      "Realizar tareas de mantenimiento.",
    ],
  },
  { p: "Cuando técnicamente sea posible, estas actuaciones se realizarán mediante sistemas automatizados o información técnica limitada." },
  { h: "22. Propiedad intelectual de Resellap" },
  { p: "Todos los derechos sobre Resellap, incluyendo, entre otros:" },
  {
    ul: [
      "Código fuente.",
      "Código objeto.",
      "Diseño.",
      "Interfaz.",
      "Logotipo.",
      "Marca.",
      "Nombre comercial.",
      "Elementos gráficos.",
      "Textos propios.",
      "Estructura.",
      "Bases de datos.",
      "Funcionalidades.",
      "Software.",
      "Documentación.",
    ],
  },
  { p: "pertenecen al prestador o a sus respectivos titulares y se encuentran protegidos por la legislación aplicable." },
  { p: "El acceso al servicio no implica la transmisión al Usuario de ningún derecho de propiedad sobre el software." },
  { h: "23. Marca Resellap" },
  {
    p: "El nombre **Resellap**, su logotipo, identidad visual y demás elementos distintivos utilizados por el servicio no podrán ser utilizados por terceros de forma que pueda generar confusión sobre su titularidad, asociación o patrocinio.",
  },
  { p: "El Usuario no adquiere ningún derecho sobre la marca por utilizar el servicio." },
  { h: "24. Licencia de uso" },
  {
    p: "Resellap concede al Usuario una licencia limitada, personal, no exclusiva y revocable para utilizar el servicio durante el período de suscripción correspondiente.",
  },
  { p: "Esta licencia únicamente permite utilizar Resellap conforme a estos Términos." },
  {
    p: "No está permitido copiar, modificar, distribuir, vender, sublicenciar, realizar ingeniería inversa o explotar comercialmente el software salvo autorización expresa o cuando la legislación aplicable lo permita.",
  },
  { h: "25. Contenido introducido por el usuario" },
  { p: "El Usuario conserva la responsabilidad sobre todo contenido que introduzca en Resellap." },
  { p: "El Usuario garantiza que dispone de los derechos necesarios para introducir y utilizar dicho contenido." },
  { p: "Resellap no verifica individualmente la legitimidad de cada producto, operación, imagen, descripción o dato introducido." },
  { h: "26. Cálculos y resultados" },
  { p: "Resellap puede realizar cálculos relacionados con:" },
  { ul: ["Costes.", "Beneficios.", "Márgenes.", "Precios.", "Ventas.", "Compras.", "Devoluciones.", "Inventario."] },
  { p: "Estos cálculos dependen de la información disponible y de las reglas implementadas en el software." },
  { p: "Resellap no garantiza que los resultados sean adecuados para fines fiscales, contables o jurídicos." },
  { p: "El Usuario deberá verificar los resultados cuando éstos sean utilizados para obligaciones legales, fiscales o contables." },
  { h: "27. Disponibilidad del servicio" },
  { p: "Resellap realizará esfuerzos razonables para mantener el servicio disponible." },
  { p: "Sin embargo, el servicio puede experimentar interrupciones debido a:" },
  {
    ul: [
      "Mantenimiento.",
      "Actualizaciones.",
      "Problemas técnicos.",
      "Fallos de proveedores.",
      "Problemas de infraestructura.",
      "Ataques informáticos.",
      "Fallos de conexión.",
      "Circunstancias fuera del control razonable del prestador.",
    ],
  },
  { p: "No se garantiza una disponibilidad ininterrumpida del servicio salvo que expresamente se indique lo contrario." },
  { h: "28. Modificaciones del servicio" },
  { p: "Resellap podrá modificar, actualizar, ampliar o eliminar funcionalidades." },
  { p: "Estas modificaciones podrán realizarse para:" },
  {
    ul: [
      "Mejorar el servicio.",
      "Corregir errores.",
      "Mejorar la seguridad.",
      "Adaptarse a cambios tecnológicos.",
      "Cumplir obligaciones legales.",
      "Introducir nuevas funcionalidades.",
      "Eliminar funcionalidades obsoletas.",
    ],
  },
  { p: "Cuando una modificación afecte de manera sustancial a las condiciones contratadas, se proporcionará la información que legalmente corresponda." },
  { h: "29. Actualizaciones" },
  { p: "El Usuario acepta que Resellap pueda realizar actualizaciones técnicas necesarias para mantener la seguridad y funcionamiento del software." },
  { p: "Algunas actualizaciones podrán instalarse automáticamente." },
  { p: "El Usuario deberá mantener actualizados los dispositivos, navegadores y sistemas necesarios para utilizar correctamente el servicio." },
  { h: "30. Servicios de terceros" },
  { p: "Resellap puede utilizar proveedores externos necesarios para prestar el servicio." },
  { p: "Estos pueden incluir proveedores de:" },
  {
    ul: [
      "Hosting.",
      "Bases de datos.",
      "Procesamiento de pagos.",
      "Envío de correo electrónico.",
      "Almacenamiento.",
      "Analítica.",
      "Seguridad.",
      "Infraestructura tecnológica.",
    ],
  },
  { p: "El funcionamiento de determinados componentes puede depender de dichos proveedores." },
  { p: "Cuando corresponda, estos terceros tratarán los datos conforme a sus propias condiciones y a los acuerdos aplicables con Resellap." },
  { h: "31. Soporte" },
  { p: "Resellap ofrece soporte mediante:" },
  { p: "**soporte@resellap.com**" },
  { p: "El soporte estará destinado principalmente a resolver incidencias relacionadas con el funcionamiento técnico del servicio." },
  { p: "El soporte no constituye asesoramiento:" },
  { ul: ["Fiscal.", "Contable.", "Jurídico.", "Financiero.", "Empresarial.", "De inversión.", "Comercial personalizado."] },
  { p: "Resellap podrá establecer tiempos de respuesta razonables dependiendo de la naturaleza y prioridad de la incidencia." },
  { h: "32. Limitación de responsabilidad" },
  { p: "En la máxima medida permitida por la legislación aplicable, Resellap no será responsable de daños derivados de:" },
  {
    ul: [
      "Uso incorrecto del servicio.",
      "Información incorrecta introducida por el Usuario.",
      "Decisiones tomadas utilizando información proporcionada por el software.",
      "Actividad comercial del Usuario.",
      "Actividad de terceros.",
      "Plataformas externas.",
      "Bloqueos de cuentas externas.",
      "Fraudes realizados por Usuarios o terceros.",
      "Pérdidas comerciales.",
      "Pérdida de beneficios.",
      "Interrupciones causadas por terceros.",
      "Problemas derivados de dispositivos o conexiones del Usuario.",
      "Uso indebido de las credenciales.",
      "Incumplimiento de las condiciones de plataformas externas.",
    ],
  },
  { p: "Nada de lo dispuesto en estos Términos pretende excluir o limitar una responsabilidad que legalmente no pueda ser excluida o limitada." },
  { h: "33. Datos y copias de seguridad" },
  { p: "Resellap adoptará medidas razonables para preservar la información almacenada." },
  { p: "Sin embargo, el Usuario debe mantener sus propias copias de seguridad cuando la información sea especialmente importante." },
  { p: "Resellap podrá proporcionar herramientas de exportación para facilitar la recuperación de los datos." },
  { h: "34. Exportación de datos" },
  { p: "El Usuario podrá exportar sus datos mediante las funcionalidades disponibles en Resellap." },
  { p: "Los formatos de exportación podrán variar según las funcionalidades disponibles en cada momento." },
  { p: "La exportación será responsabilidad del Usuario." },
  { p: "Resellap no garantiza que un formato de exportación concreto sea compatible con una aplicación de terceros." },
  { h: "35. Eliminación de cuenta" },
  { p: "El Usuario podrá solicitar la eliminación de su cuenta conforme a los mecanismos disponibles." },
  {
    p: "La eliminación de la cuenta podrá implicar la eliminación de los datos asociados, salvo aquellos que deban conservarse por obligación legal o para el ejercicio o defensa de reclamaciones.",
  },
  { p: "La eliminación de datos podrá no ser inmediata cuando existan obligaciones legales, técnicas o de seguridad que requieran su conservación temporal." },
  { h: "36. Información fiscal y contable" },
  { p: "Resellap no sustituye a un asesor fiscal, gestor, asesor contable o profesional cualificado." },
  {
    p: "Los registros y cálculos realizados mediante Resellap no deben considerarse automáticamente libros contables oficiales, declaraciones fiscales, facturas legalmente válidas o documentos tributarios.",
  },
  { p: "El Usuario será responsable de cumplir sus obligaciones fiscales y contables." },
  { h: "37. Actividades ilegales" },
  {
    p: "Resellap podrá suspender o limitar cuentas cuando existan indicios razonables de utilización ilícita, fraudulenta, abusiva o contraria a estos Términos.",
  },
  { p: "Cuando legalmente sea posible, Resellap podrá solicitar información adicional para investigar determinadas incidencias." },
  { h: "38. Suspensión de la cuenta" },
  { p: "Resellap podrá suspender temporalmente una cuenta cuando sea necesario para:" },
  {
    ul: [
      "Proteger la seguridad del servicio.",
      "Investigar un posible uso fraudulento.",
      "Prevenir daños a terceros.",
      "Prevenir ataques o abusos.",
      "Cumplir obligaciones legales.",
      "Evitar un uso contrario a estos Términos.",
    ],
  },
  { p: "Cuando sea razonablemente posible, el Usuario será informado de la causa de la suspensión." },
  { h: "39. Terminación del servicio" },
  {
    p: "Resellap podrá finalizar la relación contractual con un Usuario cuando exista una causa legítima, incluyendo incumplimientos graves o reiterados de estos Términos.",
  },
  { p: "La terminación se realizará respetando los derechos que correspondan al Usuario conforme a la legislación aplicable." },
  { h: "40. Consumidores y usuarios" },
  { p: "Cuando el Usuario tenga la condición legal de consumidor, serán aplicables las normas imperativas de protección de consumidores que correspondan." },
  { p: "Ninguna disposición de estos Términos pretende eliminar derechos que legalmente correspondan a los consumidores." },
  { h: "41. Derecho de desistimiento" },
  {
    p: "Cuando el Usuario tenga legalmente derecho de desistimiento, se aplicarán las disposiciones previstas en la normativa española y europea de protección de consumidores.",
  },
  {
    p: "Cuando la prestación del servicio digital comience inmediatamente después de la contratación, el Usuario será informado de las consecuencias legales correspondientes y, cuando sea necesario, deberá prestar el consentimiento o realizar la aceptación exigida por la normativa aplicable.",
  },
  { h: "42. Modificación de los términos" },
  { p: "Resellap podrá modificar estos Términos cuando resulte necesario debido a:" },
  {
    ul: [
      "Cambios legales.",
      "Cambios regulatorios.",
      "Cambios en el servicio.",
      "Nuevas funcionalidades.",
      "Cambios tecnológicos.",
      "Necesidades de seguridad.",
      "Cambios comerciales.",
    ],
  },
  { p: "Cuando las modificaciones sean relevantes, Resellap comunicará los cambios de forma adecuada." },
  {
    p: "La utilización del servicio después de la entrada en vigor de las nuevas condiciones podrá quedar sujeta a ellas, sin perjuicio de los derechos legalmente reconocidos al Usuario.",
  },
  { h: "43. Comunicaciones" },
  { p: "Las comunicaciones relacionadas con la cuenta podrán enviarse a la dirección de correo electrónico proporcionada por el Usuario." },
  { p: "El Usuario deberá mantener una dirección de correo electrónico válida y accesible." },
  { h: "44. Comunicaciones comerciales" },
  { p: "Resellap podrá enviar comunicaciones relacionadas directamente con el funcionamiento del servicio, incluyendo:" },
  { ul: ["Confirmaciones.", "Avisos de seguridad.", "Cambios de servicio.", "Información sobre pagos.", "Avisos de renovación.", "Comunicaciones técnicas."] },
  {
    p: "Las comunicaciones comerciales se realizarán conforme a la legislación aplicable y a las preferencias y consentimientos del Usuario cuando sean necesarios.",
  },
  { h: "45. Protección de datos" },
  { p: "El tratamiento de datos personales realizado mediante Resellap se regirá por la correspondiente **Política de Privacidad**." },
  { p: "Dicha Política explicará, entre otros aspectos:" },
  {
    ul: [
      "Qué datos se recopilan.",
      "Para qué se utilizan.",
      "Base jurídica del tratamiento.",
      "Plazos de conservación.",
      "Proveedores utilizados.",
      "Derechos del Usuario.",
      "Cómo ejercer dichos derechos.",
    ],
  },
  { h: "46. Cookies" },
  { p: "Resellap podrá utilizar cookies y tecnologías similares." },
  { p: "Cuando determinadas cookies requieran consentimiento, se solicitará mediante el mecanismo correspondiente." },
  { p: "La información detallada sobre las cookies utilizadas se incluirá en la correspondiente **Política de Cookies**." },
  { h: "47. Enlaces externos" },
  { p: "Resellap podrá contener enlaces a páginas o servicios de terceros." },
  { p: "Resellap no controla el contenido, disponibilidad, seguridad o políticas de dichos sitios." },
  { p: "El acceso a dichos sitios será responsabilidad del Usuario." },
  { h: "48. Fuerza mayor" },
  { p: "Resellap no será responsable por incumplimientos o retrasos derivados de circunstancias que razonablemente escapen a su control." },
  { p: "Esto podrá incluir, entre otras:" },
  {
    ul: [
      "Desastres naturales.",
      "Fallos generalizados de Internet.",
      "Incendios.",
      "Inundaciones.",
      "Conflictos laborales.",
      "Ataques informáticos.",
      "Fallos de proveedores críticos.",
      "Actos gubernamentales.",
      "Conflictos bélicos.",
      "Situaciones de emergencia.",
      "Fallos generalizados de infraestructura.",
    ],
  },
  { h: "49. Integridad del contrato" },
  {
    p: "Estos Términos, junto con la Política de Privacidad, Política de Cookies y cualquier documento expresamente incorporado por referencia, constituyen el conjunto de condiciones aplicables al uso del servicio.",
  },
  { p: "Si alguna disposición fuera declarada inválida o inaplicable, las restantes disposiciones continuarán vigentes en la medida legalmente posible." },
  { h: "50. No renuncia" },
  { p: "La falta de ejercicio inmediato de un derecho por parte de Resellap no supondrá necesariamente una renuncia a dicho derecho." },
  { h: "51. Legislación aplicable" },
  {
    p: "La relación contractual se regirá por la legislación española, sin perjuicio de las normas imperativas que puedan resultar aplicables al Usuario por razón de su condición de consumidor o de su lugar de residencia.",
  },
  { h: "52. Jurisdicción" },
  {
    p: "Cuando el Usuario tenga la condición de consumidor, serán competentes los tribunales que correspondan conforme a las normas imperativas aplicables en materia de protección de consumidores.",
  },
  {
    p: "Cuando el Usuario actúe como empresario o profesional, las partes se someterán a los tribunales que resulten competentes conforme a la legislación aplicable y, cuando legalmente sea posible, a los tribunales correspondientes al domicilio del prestador.",
  },
  { h: "53. Contacto" },
  { p: "Para cualquier consulta relacionada con estos Términos o con el funcionamiento del servicio:" },
  { p: "**Resellap**\n**Soporte:** soporte@resellap.com" },
  { h: "Aceptación" },
  {
    p: "Al registrarse, contratar o utilizar Resellap, el Usuario declara haber leído y comprendido estos Términos y Condiciones y acepta quedar vinculado por ellos en la medida legalmente aplicable.",
  },
  {
    p: "Cuando la contratación requiera una aceptación expresa, ésta se realizará mediante el mecanismo habilitado durante el proceso de registro o contratación.",
  },
];

/** Convierte **negrita**, saltos de línea y el email de soporte en elementos. */
function rich(text: string): ReactNode {
  return text.split("\n").map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        const bold = part.startsWith("**") && part.endsWith("**");
        const content = (bold ? part.slice(2, -2) : part).split(SUPPORT_EMAIL).flatMap((chunk, j) =>
          j === 0
            ? [chunk]
            : [
                <a key={`m${j}`} href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>,
                chunk,
              ],
        );
        return bold ? (
          <strong key={i} className="font-semibold text-ink">
            {content}
          </strong>
        ) : (
          <Fragment key={i}>{content}</Fragment>
        );
      })}
    </Fragment>
  ));
}

export default function TermsPage() {
  const t = tSync();
  return (
    <LegalPage title={t("Términos y condiciones de uso")} updated="20 de octubre de 2026">
      {BLOCKS.map((b, i) =>
        "h" in b ? (
          <h2 key={i}>{b.h}</h2>
        ) : "p" in b ? (
          <p key={i}>{rich(b.p)}</p>
        ) : (
          <ul key={i}>
            {b.ul.map((item, j) => (
              <li key={j}>{rich(item)}</li>
            ))}
          </ul>
        ),
      )}
    </LegalPage>
  );
}
