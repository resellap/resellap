import { getFormat, getT } from "@/i18n/server";
import { msg } from "@/i18n/translate";
import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { LegalPage } from "@/components/public-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Términos y condiciones") };
}

const SUPPORT_EMAIL = "soporte@resellap.com";

type Block = { h: string } | { p: string } | { ul: string[] };

/** Texto íntegro de los Términos y Condiciones. **negrita** y saltos de línea se respetan. */
const BLOCKS: Block[] = [
  { h: msg("1. Identificación del prestador") },
  {
    p: msg("Estos Términos y Condiciones regulan el acceso y utilización de la plataforma digital denominada **Resellap** y de los servicios ofrecidos a través de ella."),
  },
  { p: msg("Actualmente, el servicio es prestado por una **persona física establecida en España**, titular y responsable de la explotación de Resellap.") },
  {
    p: msg("Los datos identificativos completos del prestador, incluyendo nombre y apellidos, domicilio a efectos legales y demás información legalmente exigible, serán incorporados y actualizados en esta sección antes del inicio de la comercialización efectiva del servicio, de conformidad con la normativa aplicable."),
  },
  { p: msg("**Correo electrónico de contacto y soporte:** soporte@resellap.com") },
  {
    p: msg("Resellap es un software de tipo **SaaS (Software as a Service)** destinado a ayudar a los usuarios a organizar y gestionar información relacionada con sus actividades de compraventa y negocios, incluyendo, entre otras funcionalidades, la gestión de productos, compras, ventas, devoluciones, costes, beneficios y otra información introducida por el propio usuario."),
  },
  { h: msg("2. Definiciones") },
  { p: msg("A efectos de estos Términos:") },
  {
    p: msg('**"Resellap"** hace referencia a la plataforma, software, aplicación, sitio web, funcionalidades, servicios y contenidos puestos a disposición por el prestador.'),
  },
  { p: msg('**"Usuario"** hace referencia a cualquier persona que cree una cuenta, acceda o utilice Resellap.') },
  { p: msg('**"Cuenta"** hace referencia al perfil creado por el Usuario para acceder al servicio.') },
  {
    p: msg('**"Contenido del Usuario"** hace referencia a cualquier información, dato, texto, imagen, archivo, registro, producto, venta, compra, precio, coste, devolución o cualquier otro contenido introducido, cargado, generado o almacenado por el Usuario.'),
  },
  {
    p: msg('**"Plataformas Externas"** hace referencia a terceros servicios, marketplaces, plataformas de comercio electrónico, aplicaciones o sitios web que el Usuario pueda utilizar conjuntamente con Resellap.'),
  },
  { p: msg('**"Servicio"** hace referencia a las funcionalidades proporcionadas por Resellap mediante el modelo SaaS.') },
  { h: msg("3. Objeto del servicio") },
  { p: msg("Resellap proporciona una herramienta tecnológica destinada a facilitar la organización y gestión de actividades de compraventa y negocios.") },
  { p: msg("Entre sus funcionalidades pueden encontrarse:") },
  {
    ul: [
      msg("Registro y organización de productos."),
      msg("Registro de compras."),
      msg("Registro de ventas."),
      msg("Registro de devoluciones."),
      msg("Control de costes."),
      msg("Cálculo y organización de beneficios."),
      msg("Gestión de información relacionada con operaciones."),
      msg("Automatización o importación de determinada información."),
      msg("Herramientas destinadas a facilitar la gestión de la actividad del Usuario."),
      msg("Otras funcionalidades que puedan incorporarse posteriormente."),
    ],
  },
  { p: msg("Las funcionalidades concretas disponibles podrán modificarse, ampliarse, reducirse o sustituirse con el tiempo.") },
  { p: msg("Resellap **no constituye una asesoría profesional**, financiera, fiscal, contable, jurídica, empresarial ni de inversión.") },
  { p: msg("La información, cálculos, indicadores o resultados proporcionados por el software tienen carácter meramente informativo y de gestión.") },
  { p: msg("El Usuario será en todo momento responsable de verificar la información utilizada para tomar decisiones relacionadas con su actividad.") },
  { h: msg("4. Ausencia de asesoramiento") },
  { p: msg("Resellap no proporciona asesoramiento personalizado al Usuario.") },
  { p: msg("En particular, Resellap no garantiza:") },
  {
    ul: [
      msg("Que una determinada estrategia comercial vaya a generar beneficios."),
      msg("Que un producto vaya a venderse."),
      msg("Que una determinada compra sea rentable."),
      msg("Que una actividad comercial cumpla las obligaciones fiscales del Usuario."),
      msg("Que una operación sea jurídicamente válida."),
      msg("Que una determinada plataforma externa permita realizar una operación."),
      msg("Que el Usuario obtenga determinados ingresos."),
    ],
  },
  { p: msg("Cualquier cálculo efectuado por el software dependerá de los datos introducidos o recibidos mediante los mecanismos disponibles.") },
  {
    p: msg("El Usuario debe realizar las comprobaciones que considere necesarias antes de utilizar dichos datos para tomar decisiones económicas, fiscales, comerciales o de cualquier otra naturaleza."),
  },
  { h: msg("5. Plataformas de terceros") },
  { p: msg("Resellap puede permitir al Usuario organizar o incorporar información relacionada con plataformas externas de compraventa.") },
  { p: msg("Estas plataformas son independientes de Resellap.") },
  {
    p: msg("Resellap **no es propietaria, operadora, representante, agente, distribuidora ni afiliada**, salvo indicación expresa, de ninguna plataforma externa."),
  },
  {
    p: msg("Las marcas, nombres comerciales, logotipos y demás derechos de propiedad intelectual pertenecientes a terceros corresponden exclusivamente a sus respectivos titulares."),
  },
  {
    p: msg("El uso de nombres o referencias a plataformas externas dentro de Resellap tiene exclusivamente una finalidad funcional, informativa o de compatibilidad."),
  },
  { h: msg("6. Importación y recepción de información") },
  {
    p: msg("Cuando Resellap permita importar información procedente de una plataforma externa, dicha información podrá obtenerse mediante mecanismos como correos electrónicos de confirmación de operaciones u otros medios técnicos disponibles."),
  },
  {
    p: msg("Estas funcionalidades no implican necesariamente la existencia de una integración oficial, API oficial, asociación comercial o autorización por parte de la plataforma externa."),
  },
  {
    p: msg("El Usuario autoriza a Resellap a procesar la información que éste facilite o permita recibir con la finalidad de proporcionar las funcionalidades contratadas."),
  },
  {
    p: msg("El Usuario será responsable de asegurarse de que dispone de los derechos y autorizaciones necesarios para utilizar dichos mecanismos con sus cuentas y datos."),
  },
  { h: msg("7. Responsabilidad sobre plataformas externas") },
  { p: msg("Resellap no controla las plataformas externas.") },
  { p: msg("Por tanto, no será responsable de:") },
  {
    ul: [
      msg("Bloqueos de cuentas."),
      msg("Suspensiones."),
      msg("Cancelaciones de cuentas."),
      msg("Restricciones comerciales."),
      msg("Cambios en las políticas de terceros."),
      msg("Cambios en sistemas de terceros."),
      msg("Eliminación de anuncios."),
      msg("Eliminación de publicaciones."),
      msg("Retenciones de fondos."),
      msg("Cancelaciones de operaciones."),
      msg("Disputas entre compradores y vendedores."),
      msg("Fraudes cometidos por terceros."),
      msg("Pérdidas económicas ocasionadas por actuaciones de plataformas externas."),
      msg("Fallos, modificaciones o interrupciones de servicios externos."),
    ],
  },
  { p: msg("El Usuario utilizará las plataformas externas bajo sus propios términos y condiciones y deberá cumplir las normas de cada una de ellas.") },
  { h: msg("8. Responsabilidad del usuario sobre su actividad") },
  { p: msg("El Usuario es el único responsable de la actividad que realice utilizando Resellap.") },
  { p: msg("Esto incluye, entre otros:") },
  {
    ul: [
      msg("Los productos que compre."),
      msg("Los productos que venda."),
      msg("Los precios establecidos."),
      msg("Las descripciones utilizadas."),
      msg("La autenticidad de los productos."),
      msg("La legalidad de sus operaciones."),
      msg("La procedencia de los productos."),
      msg("Las obligaciones fiscales que correspondan."),
      msg("Las obligaciones contables que correspondan."),
      msg("Las obligaciones frente a consumidores."),
      msg("El cumplimiento de las condiciones de las plataformas externas."),
      msg("Los datos introducidos en Resellap."),
    ],
  },
  { p: msg("Resellap proporciona una herramienta tecnológica de gestión y no participa en las operaciones comerciales realizadas por el Usuario.") },
  { h: msg("9. Prohibiciones de uso") },
  { p: msg("El Usuario no podrá utilizar Resellap para actividades ilegales o fraudulentas.") },
  { p: msg("Queda prohibido utilizar el servicio para:") },
  {
    ul: [
      msg("Cometer actividades ilícitas."),
      msg("Facilitar actividades fraudulentas."),
      msg("Distribuir contenido ilegal."),
      msg("Intentar obtener acceso no autorizado a sistemas."),
      msg("Interferir deliberadamente en el funcionamiento de Resellap."),
      msg("Introducir código malicioso."),
      msg("Intentar vulnerar los sistemas de seguridad."),
      msg("Utilizar el servicio para perjudicar a terceros."),
      msg("Suplantar la identidad de otras personas."),
      msg("Utilizar Resellap para actividades contrarias a la legislación aplicable."),
    ],
  },
  {
    p: msg("Resellap podrá adoptar las medidas razonables necesarias cuando detecte un uso que pueda comprometer la seguridad, funcionamiento o legalidad del servicio."),
  },
  { h: msg("10. Creación de cuenta") },
  { p: msg("Para utilizar determinadas funcionalidades será necesario crear una cuenta.") },
  { p: msg("El Usuario deberá proporcionar información veraz, actualizada y suficiente para la creación y mantenimiento de la cuenta.") },
  { p: msg("El Usuario será responsable de mantener actualizada dicha información.") },
  { p: msg("Cada Usuario deberá mantener sus credenciales de acceso bajo medidas razonables de seguridad.") },
  { h: msg("11. Uso compartido de la cuenta") },
  { p: msg("Resellap permite al Usuario compartir sus credenciales de acceso con otras personas bajo su propia responsabilidad.") },
  { p: msg("El Usuario será responsable de las actuaciones realizadas desde su cuenta.") },
  {
    p: msg("Resellap no será responsable de los daños derivados del uso compartido de credenciales cuando éstos sean consecuencia de decisiones o actuaciones del propio Usuario o de las personas a quienes haya facilitado voluntariamente el acceso."),
  },
  { p: msg("El Usuario deberá adoptar medidas razonables para evitar accesos no autorizados.") },
  { h: msg("12. Seguridad de la cuenta") },
  { p: msg("El Usuario deberá mantener la confidencialidad de sus credenciales.") },
  { p: msg("Si sospecha que un tercero ha obtenido acceso no autorizado a su cuenta, deberá comunicarlo a Resellap mediante el correo:") },
  { p: msg("**soporte@resellap.com**") },
  { p: msg("Resellap podrá solicitar información adicional para verificar la titularidad de la cuenta antes de realizar determinadas actuaciones.") },
  { h: msg("13. Precio del servicio") },
  { p: msg("Actualmente Resellap ofrece un único plan de suscripción:") },
  { p: msg("**4,99 € al mes.**") },
  {
    p: msg("Los precios mostrados durante el proceso de contratación serán los aplicables en el momento de contratar, sin perjuicio de las modificaciones futuras comunicadas conforme a la normativa aplicable."),
  },
  { p: msg("Los impuestos que legalmente correspondan serán aplicados según la situación fiscal del Usuario y del prestador.") },
  { h: msg("14. Prueba gratuita") },
  { p: msg("Resellap ofrece inicialmente un período de prueba gratuito de **7 días**.") },
  { p: msg("Durante el período de prueba el Usuario podrá utilizar el servicio conforme a las funcionalidades disponibles en cada momento.") },
  { p: msg("La prueba gratuita no garantiza que todas las funcionalidades futuras estén disponibles durante dicho período.") },
  { p: msg("El Usuario podrá cancelar la suscripción durante el período de prueba.") },
  { h: msg("15. Renovación automática") },
  {
    p: msg("Una vez finalizado el período de prueba gratuito, la suscripción se renovará automáticamente por períodos mensuales, salvo que el Usuario la cancele previamente."),
  },
  { p: msg("El importe aplicable será el correspondiente al plan contratado en ese momento.") },
  { p: msg("La renovación se realizará mediante el sistema de pago habilitado por Resellap.") },
  { p: msg("El Usuario acepta expresamente la renovación automática al contratar la suscripción.") },
  { h: msg("16. Pagos") },
  { p: msg("Los pagos serán procesados mediante **Stripe** o los proveedores de servicios de pago que Resellap utilice en cada momento.") },
  {
    p: msg("Resellap no almacena directamente los datos completos de las tarjetas bancarias cuando el procesamiento sea realizado por el proveedor de pagos correspondiente."),
  },
  { p: msg("El Usuario deberá proporcionar los datos necesarios para completar el proceso de pago al proveedor de servicios correspondiente.") },
  { p: msg("Los pagos podrán estar sujetos a las condiciones y políticas del proveedor de pago.") },
  { h: msg("17. Cancelación de la suscripción") },
  { p: msg("El Usuario podrá cancelar su suscripción en cualquier momento.") },
  { p: msg("La cancelación podrá realizarse incluso durante el período de prueba gratuito.") },
  { p: msg("Cuando se cancele una suscripción ya iniciada, la cancelación impedirá la siguiente renovación automática.") },
  { p: msg("Salvo que legalmente corresponda otra cosa, la cancelación no supondrá necesariamente el reembolso de períodos ya iniciados.") },
  { p: msg("El Usuario mantendrá el acceso al servicio hasta la finalización del período de facturación correspondiente.") },
  { h: msg("18. Finalización del período contratado") },
  { p: msg("Una vez finalizado el período contratado, el acceso a determinadas funcionalidades podrá quedar restringido.") },
  { p: msg("Resellap podrá permitir al Usuario acceder a sus datos almacenados con el objetivo de exportarlos.") },
  { p: msg("Durante este período restringido, el Usuario podrá no disponer de la posibilidad de:") },
  {
    ul: [
      msg("Crear nuevos registros."),
      msg("Modificar registros existentes."),
      msg("Añadir nuevas ventas."),
      msg("Añadir nuevas compras."),
      msg("Utilizar determinadas funcionalidades premium."),
    ],
  },
  { p: msg("La finalidad de este acceso será facilitar la recuperación y exportación de la información del Usuario.") },
  { h: msg("19. Datos del usuario") },
  { p: msg("El Usuario conserva sus derechos sobre los datos y contenidos que introduzca en Resellap.") },
  {
    p: msg("Resellap tratará dichos datos exclusivamente en la medida necesaria para proporcionar el servicio, mantener la seguridad, cumplir obligaciones legales y realizar las operaciones necesarias para el funcionamiento de la plataforma."),
  },
  {
    p: msg("Resellap no utilizará los datos privados de las cuentas para examinar qué productos concretos vende o compra cada Usuario con fines comerciales propios."),
  },
  { p: msg("El tratamiento de datos personales se desarrollará conforme a la Política de Privacidad de Resellap.") },
  { h: msg("20. Seguridad y confidencialidad") },
  {
    p: msg("Resellap aplicará medidas técnicas y organizativas razonables destinadas a proteger la información almacenada frente a accesos no autorizados, pérdida, destrucción o alteración."),
  },
  { p: msg("La información almacenada podrá estar protegida mediante mecanismos de cifrado y controles de acceso.") },
  { p: msg("No obstante, ningún sistema conectado a Internet puede garantizar una seguridad absoluta.") },
  { p: msg("Por ello, Resellap no garantiza que el servicio esté completamente libre de vulnerabilidades, ataques, interrupciones o accesos ilícitos.") },
  { h: msg("21. Acceso del prestador a los datos") },
  { p: msg("Resellap está diseñado para minimizar el acceso humano a los datos privados almacenados por los Usuarios.") },
  { p: msg("El prestador no accederá deliberadamente al contenido privado de las cuentas para conocer qué productos compra o vende cada Usuario.") },
  { p: msg("No obstante, podrán producirse accesos técnicos estrictamente necesarios para:") },
  {
    ul: [
      msg("Mantener el funcionamiento del servicio."),
      msg("Resolver incidencias técnicas."),
      msg("Garantizar la seguridad."),
      msg("Detectar abusos."),
      msg("Prevenir fraude."),
      msg("Cumplir obligaciones legales."),
      msg("Realizar tareas de mantenimiento."),
    ],
  },
  { p: msg("Cuando técnicamente sea posible, estas actuaciones se realizarán mediante sistemas automatizados o información técnica limitada.") },
  { h: msg("22. Propiedad intelectual de Resellap") },
  { p: msg("Todos los derechos sobre Resellap, incluyendo, entre otros:") },
  {
    ul: [
      msg("Código fuente."),
      msg("Código objeto."),
      msg("Diseño."),
      msg("Interfaz."),
      msg("Logotipo."),
      msg("Marca."),
      msg("Nombre comercial."),
      msg("Elementos gráficos."),
      msg("Textos propios."),
      msg("Estructura."),
      msg("Bases de datos."),
      msg("Funcionalidades."),
      msg("Software."),
      msg("Documentación."),
    ],
  },
  { p: msg("pertenecen al prestador o a sus respectivos titulares y se encuentran protegidos por la legislación aplicable.") },
  { p: msg("El acceso al servicio no implica la transmisión al Usuario de ningún derecho de propiedad sobre el software.") },
  { h: msg("23. Marca Resellap") },
  {
    p: msg("El nombre **Resellap**, su logotipo, identidad visual y demás elementos distintivos utilizados por el servicio no podrán ser utilizados por terceros de forma que pueda generar confusión sobre su titularidad, asociación o patrocinio."),
  },
  { p: msg("El Usuario no adquiere ningún derecho sobre la marca por utilizar el servicio.") },
  { h: msg("24. Licencia de uso") },
  {
    p: msg("Resellap concede al Usuario una licencia limitada, personal, no exclusiva y revocable para utilizar el servicio durante el período de suscripción correspondiente."),
  },
  { p: msg("Esta licencia únicamente permite utilizar Resellap conforme a estos Términos.") },
  {
    p: msg("No está permitido copiar, modificar, distribuir, vender, sublicenciar, realizar ingeniería inversa o explotar comercialmente el software salvo autorización expresa o cuando la legislación aplicable lo permita."),
  },
  { h: msg("25. Contenido introducido por el usuario") },
  { p: msg("El Usuario conserva la responsabilidad sobre todo contenido que introduzca en Resellap.") },
  { p: msg("El Usuario garantiza que dispone de los derechos necesarios para introducir y utilizar dicho contenido.") },
  { p: msg("Resellap no verifica individualmente la legitimidad de cada producto, operación, imagen, descripción o dato introducido.") },
  { h: msg("26. Cálculos y resultados") },
  { p: msg("Resellap puede realizar cálculos relacionados con:") },
  { ul: [msg("Costes."), msg("Beneficios."), msg("Márgenes."), msg("Precios."), msg("Ventas."), msg("Compras."), msg("Devoluciones."), msg("Inventario.")] },
  { p: msg("Estos cálculos dependen de la información disponible y de las reglas implementadas en el software.") },
  { p: msg("Resellap no garantiza que los resultados sean adecuados para fines fiscales, contables o jurídicos.") },
  { p: msg("El Usuario deberá verificar los resultados cuando éstos sean utilizados para obligaciones legales, fiscales o contables.") },
  { h: msg("27. Disponibilidad del servicio") },
  { p: msg("Resellap realizará esfuerzos razonables para mantener el servicio disponible.") },
  { p: msg("Sin embargo, el servicio puede experimentar interrupciones debido a:") },
  {
    ul: [
      msg("Mantenimiento."),
      msg("Actualizaciones."),
      msg("Problemas técnicos."),
      msg("Fallos de proveedores."),
      msg("Problemas de infraestructura."),
      msg("Ataques informáticos."),
      msg("Fallos de conexión."),
      msg("Circunstancias fuera del control razonable del prestador."),
    ],
  },
  { p: msg("No se garantiza una disponibilidad ininterrumpida del servicio salvo que expresamente se indique lo contrario.") },
  { h: msg("28. Modificaciones del servicio") },
  { p: msg("Resellap podrá modificar, actualizar, ampliar o eliminar funcionalidades.") },
  { p: msg("Estas modificaciones podrán realizarse para:") },
  {
    ul: [
      msg("Mejorar el servicio."),
      msg("Corregir errores."),
      msg("Mejorar la seguridad."),
      msg("Adaptarse a cambios tecnológicos."),
      msg("Cumplir obligaciones legales."),
      msg("Introducir nuevas funcionalidades."),
      msg("Eliminar funcionalidades obsoletas."),
    ],
  },
  { p: msg("Cuando una modificación afecte de manera sustancial a las condiciones contratadas, se proporcionará la información que legalmente corresponda.") },
  { h: msg("29. Actualizaciones") },
  { p: msg("El Usuario acepta que Resellap pueda realizar actualizaciones técnicas necesarias para mantener la seguridad y funcionamiento del software.") },
  { p: msg("Algunas actualizaciones podrán instalarse automáticamente.") },
  { p: msg("El Usuario deberá mantener actualizados los dispositivos, navegadores y sistemas necesarios para utilizar correctamente el servicio.") },
  { h: msg("30. Servicios de terceros") },
  { p: msg("Resellap puede utilizar proveedores externos necesarios para prestar el servicio.") },
  { p: msg("Estos pueden incluir proveedores de:") },
  {
    ul: [
      msg("Hosting."),
      msg("Bases de datos."),
      msg("Procesamiento de pagos."),
      msg("Envío de correo electrónico."),
      msg("Almacenamiento."),
      msg("Analítica."),
      msg("Seguridad."),
      msg("Infraestructura tecnológica."),
    ],
  },
  { p: msg("El funcionamiento de determinados componentes puede depender de dichos proveedores.") },
  { p: msg("Cuando corresponda, estos terceros tratarán los datos conforme a sus propias condiciones y a los acuerdos aplicables con Resellap.") },
  { h: msg("31. Soporte") },
  { p: msg("Resellap ofrece soporte mediante:") },
  { p: msg("**soporte@resellap.com**") },
  { p: msg("El soporte estará destinado principalmente a resolver incidencias relacionadas con el funcionamiento técnico del servicio.") },
  { p: msg("El soporte no constituye asesoramiento:") },
  { ul: [msg("Fiscal."), msg("Contable."), msg("Jurídico."), msg("Financiero."), msg("Empresarial."), msg("De inversión."), msg("Comercial personalizado.")] },
  { p: msg("Resellap podrá establecer tiempos de respuesta razonables dependiendo de la naturaleza y prioridad de la incidencia.") },
  { h: msg("32. Limitación de responsabilidad") },
  { p: msg("En la máxima medida permitida por la legislación aplicable, Resellap no será responsable de daños derivados de:") },
  {
    ul: [
      msg("Uso incorrecto del servicio."),
      msg("Información incorrecta introducida por el Usuario."),
      msg("Decisiones tomadas utilizando información proporcionada por el software."),
      msg("Actividad comercial del Usuario."),
      msg("Actividad de terceros."),
      msg("Plataformas externas."),
      msg("Bloqueos de cuentas externas."),
      msg("Fraudes realizados por Usuarios o terceros."),
      msg("Pérdidas comerciales."),
      msg("Pérdida de beneficios."),
      msg("Interrupciones causadas por terceros."),
      msg("Problemas derivados de dispositivos o conexiones del Usuario."),
      msg("Uso indebido de las credenciales."),
      msg("Incumplimiento de las condiciones de plataformas externas."),
    ],
  },
  { p: msg("Nada de lo dispuesto en estos Términos pretende excluir o limitar una responsabilidad que legalmente no pueda ser excluida o limitada.") },
  { h: msg("33. Datos y copias de seguridad") },
  { p: msg("Resellap adoptará medidas razonables para preservar la información almacenada.") },
  { p: msg("Sin embargo, el Usuario debe mantener sus propias copias de seguridad cuando la información sea especialmente importante.") },
  { p: msg("Resellap podrá proporcionar herramientas de exportación para facilitar la recuperación de los datos.") },
  { h: msg("34. Exportación de datos") },
  { p: msg("El Usuario podrá exportar sus datos mediante las funcionalidades disponibles en Resellap.") },
  { p: msg("Los formatos de exportación podrán variar según las funcionalidades disponibles en cada momento.") },
  { p: msg("La exportación será responsabilidad del Usuario.") },
  { p: msg("Resellap no garantiza que un formato de exportación concreto sea compatible con una aplicación de terceros.") },
  { h: msg("35. Eliminación de cuenta") },
  { p: msg("El Usuario podrá solicitar la eliminación de su cuenta conforme a los mecanismos disponibles.") },
  {
    p: msg("La eliminación de la cuenta podrá implicar la eliminación de los datos asociados, salvo aquellos que deban conservarse por obligación legal o para el ejercicio o defensa de reclamaciones."),
  },
  { p: msg("La eliminación de datos podrá no ser inmediata cuando existan obligaciones legales, técnicas o de seguridad que requieran su conservación temporal.") },
  { h: msg("36. Información fiscal y contable") },
  { p: msg("Resellap no sustituye a un asesor fiscal, gestor, asesor contable o profesional cualificado.") },
  {
    p: msg("Los registros y cálculos realizados mediante Resellap no deben considerarse automáticamente libros contables oficiales, declaraciones fiscales, facturas legalmente válidas o documentos tributarios."),
  },
  { p: msg("El Usuario será responsable de cumplir sus obligaciones fiscales y contables.") },
  { h: msg("37. Actividades ilegales") },
  {
    p: msg("Resellap podrá suspender o limitar cuentas cuando existan indicios razonables de utilización ilícita, fraudulenta, abusiva o contraria a estos Términos."),
  },
  { p: msg("Cuando legalmente sea posible, Resellap podrá solicitar información adicional para investigar determinadas incidencias.") },
  { h: msg("38. Suspensión de la cuenta") },
  { p: msg("Resellap podrá suspender temporalmente una cuenta cuando sea necesario para:") },
  {
    ul: [
      msg("Proteger la seguridad del servicio."),
      msg("Investigar un posible uso fraudulento."),
      msg("Prevenir daños a terceros."),
      msg("Prevenir ataques o abusos."),
      msg("Cumplir obligaciones legales."),
      msg("Evitar un uso contrario a estos Términos."),
    ],
  },
  { p: msg("Cuando sea razonablemente posible, el Usuario será informado de la causa de la suspensión.") },
  { h: msg("39. Terminación del servicio") },
  {
    p: msg("Resellap podrá finalizar la relación contractual con un Usuario cuando exista una causa legítima, incluyendo incumplimientos graves o reiterados de estos Términos."),
  },
  { p: msg("La terminación se realizará respetando los derechos que correspondan al Usuario conforme a la legislación aplicable.") },
  { h: msg("40. Consumidores y usuarios") },
  { p: msg("Cuando el Usuario tenga la condición legal de consumidor, serán aplicables las normas imperativas de protección de consumidores que correspondan.") },
  { p: msg("Ninguna disposición de estos Términos pretende eliminar derechos que legalmente correspondan a los consumidores.") },
  { h: msg("41. Derecho de desistimiento") },
  {
    p: msg("Cuando el Usuario tenga legalmente derecho de desistimiento, se aplicarán las disposiciones previstas en la normativa española y europea de protección de consumidores."),
  },
  {
    p: msg("Cuando la prestación del servicio digital comience inmediatamente después de la contratación, el Usuario será informado de las consecuencias legales correspondientes y, cuando sea necesario, deberá prestar el consentimiento o realizar la aceptación exigida por la normativa aplicable."),
  },
  { h: msg("42. Modificación de los términos") },
  { p: msg("Resellap podrá modificar estos Términos cuando resulte necesario debido a:") },
  {
    ul: [
      msg("Cambios legales."),
      msg("Cambios regulatorios."),
      msg("Cambios en el servicio."),
      msg("Nuevas funcionalidades."),
      msg("Cambios tecnológicos."),
      msg("Necesidades de seguridad."),
      msg("Cambios comerciales."),
    ],
  },
  { p: msg("Cuando las modificaciones sean relevantes, Resellap comunicará los cambios de forma adecuada.") },
  {
    p: msg("La utilización del servicio después de la entrada en vigor de las nuevas condiciones podrá quedar sujeta a ellas, sin perjuicio de los derechos legalmente reconocidos al Usuario."),
  },
  { h: msg("43. Comunicaciones") },
  { p: msg("Las comunicaciones relacionadas con la cuenta podrán enviarse a la dirección de correo electrónico proporcionada por el Usuario.") },
  { p: msg("El Usuario deberá mantener una dirección de correo electrónico válida y accesible.") },
  { h: msg("44. Comunicaciones comerciales") },
  { p: msg("Resellap podrá enviar comunicaciones relacionadas directamente con el funcionamiento del servicio, incluyendo:") },
  { ul: [msg("Confirmaciones."), msg("Avisos de seguridad."), msg("Cambios de servicio."), msg("Información sobre pagos."), msg("Avisos de renovación."), msg("Comunicaciones técnicas.")] },
  {
    p: msg("Las comunicaciones comerciales se realizarán conforme a la legislación aplicable y a las preferencias y consentimientos del Usuario cuando sean necesarios."),
  },
  { h: msg("45. Protección de datos") },
  { p: msg("El tratamiento de datos personales realizado mediante Resellap se regirá por la correspondiente **Política de Privacidad**.") },
  { p: msg("Dicha Política explicará, entre otros aspectos:") },
  {
    ul: [
      msg("Qué datos se recopilan."),
      msg("Para qué se utilizan."),
      msg("Base jurídica del tratamiento."),
      msg("Plazos de conservación."),
      msg("Proveedores utilizados."),
      msg("Derechos del Usuario."),
      msg("Cómo ejercer dichos derechos."),
    ],
  },
  { h: msg("46. Cookies") },
  { p: msg("Resellap podrá utilizar cookies y tecnologías similares.") },
  { p: msg("Cuando determinadas cookies requieran consentimiento, se solicitará mediante el mecanismo correspondiente.") },
  { p: msg("La información detallada sobre las cookies utilizadas se incluirá en la correspondiente **Política de Cookies**.") },
  { h: msg("47. Enlaces externos") },
  { p: msg("Resellap podrá contener enlaces a páginas o servicios de terceros.") },
  { p: msg("Resellap no controla el contenido, disponibilidad, seguridad o políticas de dichos sitios.") },
  { p: msg("El acceso a dichos sitios será responsabilidad del Usuario.") },
  { h: msg("48. Fuerza mayor") },
  { p: msg("Resellap no será responsable por incumplimientos o retrasos derivados de circunstancias que razonablemente escapen a su control.") },
  { p: msg("Esto podrá incluir, entre otras:") },
  {
    ul: [
      msg("Desastres naturales."),
      msg("Fallos generalizados de Internet."),
      msg("Incendios."),
      msg("Inundaciones."),
      msg("Conflictos laborales."),
      msg("Ataques informáticos."),
      msg("Fallos de proveedores críticos."),
      msg("Actos gubernamentales."),
      msg("Conflictos bélicos."),
      msg("Situaciones de emergencia."),
      msg("Fallos generalizados de infraestructura."),
    ],
  },
  { h: msg("49. Integridad del contrato") },
  {
    p: msg("Estos Términos, junto con la Política de Privacidad, Política de Cookies y cualquier documento expresamente incorporado por referencia, constituyen el conjunto de condiciones aplicables al uso del servicio."),
  },
  { p: msg("Si alguna disposición fuera declarada inválida o inaplicable, las restantes disposiciones continuarán vigentes en la medida legalmente posible.") },
  { h: msg("50. No renuncia") },
  { p: msg("La falta de ejercicio inmediato de un derecho por parte de Resellap no supondrá necesariamente una renuncia a dicho derecho.") },
  { h: msg("51. Legislación aplicable") },
  {
    p: msg("La relación contractual se regirá por la legislación española, sin perjuicio de las normas imperativas que puedan resultar aplicables al Usuario por razón de su condición de consumidor o de su lugar de residencia."),
  },
  { h: msg("52. Jurisdicción") },
  {
    p: msg("Cuando el Usuario tenga la condición de consumidor, serán competentes los tribunales que correspondan conforme a las normas imperativas aplicables en materia de protección de consumidores."),
  },
  {
    p: msg("Cuando el Usuario actúe como empresario o profesional, las partes se someterán a los tribunales que resulten competentes conforme a la legislación aplicable y, cuando legalmente sea posible, a los tribunales correspondientes al domicilio del prestador."),
  },
  { h: msg("53. Contacto") },
  { p: msg("Para cualquier consulta relacionada con estos Términos o con el funcionamiento del servicio:") },
  { p: msg("**Resellap**\n**Soporte:** soporte@resellap.com") },
  { h: msg("Aceptación") },
  {
    p: msg("Al registrarse, contratar o utilizar Resellap, el Usuario declara haber leído y comprendido estos Términos y Condiciones y acepta quedar vinculado por ellos en la medida legalmente aplicable."),
  },
  {
    p: msg("Cuando la contratación requiera una aceptación expresa, ésta se realizará mediante el mecanismo habilitado durante el proceso de registro o contratación."),
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

export default async function TermsPage() {
  const t = await getT();
  const f = await getFormat();
  return (
    <LegalPage title={t("Términos y condiciones de uso")} updated={f.longDate("2026-10-20")}>
      {BLOCKS.map((b, i) =>
        "h" in b ? (
          <h2 key={i}>{t(b.h)}</h2>
        ) : "p" in b ? (
          <p key={i}>{rich(t(b.p))}</p>
        ) : (
          <ul key={i}>
            {b.ul.map((item, j) => (
              <li key={j}>{rich(t(item))}</li>
            ))}
          </ul>
        ),
      )}
    </LegalPage>
  );
}
