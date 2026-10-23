/**
 * Centro de ayuda: preguntas frecuentes.
 *
 * Formato de las respuestas (lo pinta faq-list.tsx):
 * - Párrafos separados por una línea en blanco.
 * - Líneas que empiezan por «1. », «2. »… forman una lista de pasos.
 * - [texto](/ruta) es un enlace directo a esa pantalla.
 * - shot: captura de /public/ayuda/<shot>.webp (la genera scripts/capturas-ayuda.mjs).
 *
 * Este mismo texto es lo que lee la IA para responder dudas: si cambias cómo
 * funciona algo, cámbialo aquí y las dos cosas quedan al día.
 */
import { msg } from "@/i18n/translate";

export type Faq = { id: string; q: string; a: string; shot?: string; tags?: string };
export type FaqGroup = { id: string; title: string; items: Faq[] };

export const SHOTS: Record<string, { w: number; h: number; alt: string }> = {
  "nueva-venta": { w: 1200, h: 700, alt: msg("Pantalla Nueva venta con el buscador de productos señalado") },
  "crear-producto": { w: 1200, h: 520, alt: msg("Pantalla Inventario con el botón Nuevo producto señalado") },
  "nuevo-pedido": { w: 1200, h: 520, alt: msg("Pantalla Compras con el botón Nuevo pedido señalado") },
  importar: { w: 1200, h: 560, alt: msg("Pantalla Importar Excel con el botón para elegir el archivo señalado") },
  gmail: { w: 1200, h: 620, alt: msg("Pantalla Ventas por correo con la tarjeta de Gmail señalada") },
  detectadas: { w: 1200, h: 560, alt: msg("Una venta detectada con el botón Confirmar venta señalado") },
  envios: { w: 1200, h: 620, alt: msg("Pantalla Pendientes de envío con un transportista señalado") },
  equipo: { w: 1200, h: 520, alt: msg("Pantalla Equipo con el botón Invitar señalado") },
};

export const FAQ: FaqGroup[] = [
  {
    id: "empezar",
    title: msg("Primeros pasos"),
    items: [
      {
        id: "nueva-venta",
        q: msg("¿Cómo registro una venta nueva?"),
        tags: "vender venta registrar apuntar",
        shot: "nueva-venta",
        a: msg(`Entra en [Nueva venta](/ventas/nueva). En el móvil también puedes pulsar el botón verde «+» de la barra de abajo.

1. Busca el producto y añádelo. Una venta puede tener varios productos.
2. Elige de qué pedido o lote sale, cuántas unidades y el precio por unidad.
3. Indica la plataforma, la fecha y el responsable (son obligatorios). El móvil, la referencia y las notas son opcionales.
4. Pulsa «Registrar venta».

El stock se descuenta del lote que has elegido y el beneficio se calcula con su coste real. La venta aparece en [Ventas](/ventas) y, si tiene envío, en [Pendientes de envío](/envios).`),
      },
      {
        id: "crear-producto",
        q: msg("¿Cómo añado un producto al inventario?"),
        tags: "producto artículo crear inventario stock",
        shot: "crear-producto",
        a: msg(`En [Inventario](/productos) pulsa «Nuevo producto». Rellena el nombre y, si quieres, la marca, la categoría, el precio normal de venta, las variantes (tallas, colores…) y las fotos. Después pulsa «Crear producto».

Crear el producto no le da stock: las unidades entran cuando recibes un [pedido de compra](/compras) o con un ajuste en [Salidas y ajustes](/salidas).`),
      },
      {
        id: "pedido-compra",
        q: msg("¿Cómo meto stock con lo que me ha costado?"),
        tags: "compra pedido proveedor coste lote recibir stock",
        shot: "nuevo-pedido",
        a: msg(`Con un pedido de compra. En [Compras](/compras) pulsa «Nuevo pedido».

1. Elige el proveedor y la fecha.
2. Añade las líneas: producto, unidades y coste por unidad.
3. Si hubo transporte, aduanas, comisiones u otros gastos, apúntalos en «Costes del pedido»: se reparten entre las líneas según su valor.
4. Pulsa «Guardar como pendiente».
5. Cuando llegue la mercancía, abre el pedido y pulsa «Recibir pedido» para indicar las unidades que han llegado.

Cada línea recibida se convierte en un lote con su coste real por unidad. Los proveedores se gestionan en [Proveedores](/proveedores).`),
      },
      {
        id: "importar",
        q: msg("¿Cómo importo mis datos desde un Excel?"),
        tags: "excel importar base de datos migrar hoja xlsx",
        shot: "importar",
        a: msg(`En [Importar Excel](/importar) elige tu archivo .xlsx. Se lee en tu navegador y no se guarda nada hasta que confirmes al final.

1. Resellap lee todas las hojas y detecta qué contiene cada una.
2. Relacionas sus columnas con los campos de Resellap (se proponen solas).
3. Revisas los errores, los avisos y el resumen: productos, pedidos, ventas y salidas nuevos.
4. Simulas la importación completa para comprobar que todo cuadra.
5. Si está bien, confirmas y se guarda todo de una vez.

Si vuelves a importar el mismo Excel, lo que ya existe se omite: no se duplican productos, pedidos ni ventas. Lo que no se ha podido determinar queda en [Pendientes de revisar](/revision) para que lo completes.`),
      },
    ],
  },
  {
    id: "correo",
    title: msg("Ventas por correo"),
    items: [
      {
        id: "conectar-gmail",
        q: msg("¿Cómo conecto mi correo para que las ventas se apunten solas?"),
        tags: "gmail correo email conectar google automático",
        shot: "gmail",
        a: msg(`En [Ventas por correo](/correos) pulsa «Conectar Gmail», elige la cuenta de Google donde te llegan los correos de Vinted, Wallapop, eBay, Milanuncios o Facebook Marketplace y acepta el permiso.

Desde ese momento Resellap revisa el correo cada 5 minutos (también puedes pulsar «Revisar ahora»). Solo lee los correos que llegan después de conectar, y nunca duplica una venta.

En «Cuentas de las plataformas» asigna a cada usuario de Vinted o Wallapop su responsable y su móvil. Si no, la venta se apunta al «Responsable por defecto».`),
      },
      {
        id: "detectadas",
        q: msg("¿Qué son las ventas detectadas y cómo las confirmo?"),
        tags: "detectadas confirmar correo revisar",
        shot: "detectadas",
        a: msg(`Son las ventas que Resellap ha encontrado en tu correo. Ya trae propuestos el producto, el transportista y el comprador, pero no se registra nada ni se toca el stock hasta que tú confirmas.

En [Ventas detectadas](/detectadas), revisa cada una y pulsa:

1. «Confirmar venta» si todo está bien (antes puedes cambiar el producto, el transportista o el responsable).
2. «Ya estaba apuntada» si ya la registraste a mano.
3. «No es una venta» para descartarla.

Si tienes muchas, «Confirmar varias ventas» las confirma de una vez.`),
      },
      {
        id: "correo-no-aparece",
        q: msg("Me ha llegado una venta al correo y no aparece. ¿Qué hago?"),
        tags: "no aparece falta correo error gmail",
        a: msg(`Mira en [Ventas por correo](/correos) la fecha de la «Última revisión» y pulsa «Revisar ahora». Ahí también ves los correos que han llegado y su estado: si alguno no se ha podido leer, se explica el motivo y puedes registrarlo a mano.

Si aparece «Google ha retirado el permiso», pulsa «Volver a conectar»: no se pierde nada, los correos que llegaron mientras tanto se leen al reconectar.`),
      },
    ],
  },
  {
    id: "envios",
    title: msg("Envíos y seguimiento"),
    items: [
      {
        id: "marcar-enviado",
        q: msg("¿Cómo marco un pedido como enviado?"),
        tags: "envío enviar paquete transportista marcar",
        shot: "envios",
        a: msg(`En [Pendientes de envío](/envios) los paquetes están separados por transportista. Entra en uno, selecciona los paquetes y pulsa «Marcar como enviado».

Desde ese momento empieza su seguimiento en [Seguimiento](/seguimiento), y el tiempo de entrega se mide desde ahí hasta «Entregado».`),
      },
      {
        id: "seguimiento",
        q: msg("¿Cómo sé dónde está un paquete?"),
        tags: "seguimiento tracking código entregado alerta incidencia",
        a: msg(`En [Seguimiento](/seguimiento) ves cada envío con su estado (Enviado, En tránsito, En reparto, Entregado), su transportista y los días que lleva. Pulsa «Actualizar envíos» para traer lo último.

Si un envío no tiene código, abre la venta y rellena el apartado «Añadir código de seguimiento». Las incidencias y retrasos aparecen en la pestaña «Alertas».`),
      },
      {
        id: "etiqueta",
        q: msg("¿Dónde subo la etiqueta de envío?"),
        tags: "etiqueta pdf imprimir envío",
        a: msg(`Abre la venta desde [Ventas](/ventas) y pulsa «Subir etiqueta». Si la venta llegó por correo, la etiqueta se adjunta sola cuando llega el correo de la plataforma.

En [Pendientes de envío](/envios) ves qué paquetes todavía no tienen etiqueta.`),
      },
    ],
  },
  {
    id: "stock",
    title: msg("Stock, costes y devoluciones"),
    items: [
      {
        id: "devolucion",
        q: msg("¿Cómo registro una devolución?"),
        tags: "devolución reembolso devolver",
        a: msg(`Abre la venta desde [Ventas](/ventas) y pulsa «Registrar devolución». Indica qué vuelve y el reembolso: las unidades vuelven al stock de su lote.

Todas las devoluciones quedan en [Devoluciones](/devoluciones).`),
      },
      {
        id: "salidas",
        q: msg("He regalado, perdido o contado mal un producto. ¿Cómo lo corrijo?"),
        tags: "regalo pérdida ajuste corregir stock salida",
        a: msg(`En [Salidas y ajustes](/salidas) registras regalos y pérdidas (salidas sin venta) y corriges el stock, por ejemplo con «Añadir unidades».

Nada se borra: cada cambio queda guardado como un movimiento, para que siempre sepas por qué cambió el stock.`),
      },
      {
        id: "beneficio",
        q: msg("¿Cómo se calcula el beneficio?"),
        tags: "beneficio margen coste ganancia valor almacén",
        a: msg(`Cada venta usa el coste real del lote del que salió (lo que costó la mercancía más su parte de los gastos del pedido).

El valor del almacén usa el coste medio de las unidades que quedan. Lo tienes en [Lotes y costes](/inventario); las cifras por vendedor, en [Responsables](/responsables).`),
      },
      {
        id: "reparto",
        q: msg("¿Cómo funciona el reparto entre socios?"),
        tags: "socios reparto dividir pagar deber",
        a: msg(`En [Reparto entre socios](/reparto) el total vendido se reparte a partes iguales entre los socios. Como cada uno ha cobrado sus propias ventas, ahí ves quién debe pagar a quién y cuánto.`),
      },
    ],
  },
  {
    id: "anuncios",
    title: msg("Anuncios"),
    items: [
      {
        id: "anuncios",
        q: msg("¿Resellap publica mis anuncios?"),
        tags: "anuncio publicar vinted wallapop",
        a: msg(`No: las plataformas no lo permiten. En [Anuncios](/anuncios) llevas la cuenta de lo que tienes anunciado y dónde, y te queda todo preparado para publicarlo tú.`),
      },
      {
        id: "descripciones",
        q: msg("¿Cómo creo el texto de un anuncio?"),
        tags: "descripción texto ia generar anuncio",
        a: msg(`En el [Generador de descripciones](/descripciones) eliges productos de tu inventario, la plataforma, el tono y la longitud, y la IA escribe el texto. Solo lee tus productos: no cambia el stock ni las fichas.`),
      },
    ],
  },
  {
    id: "cuenta",
    title: msg("Equipo, cuenta y suscripción"),
    items: [
      {
        id: "invitar",
        q: msg("¿Cómo invito a alguien a mi equipo?"),
        tags: "equipo invitar usuario permisos rol vendedor almacén",
        shot: "equipo",
        a: msg(`En [Equipo](/equipo) pulsa «Invitar» y elige su rol:

1. Administrador: todo, incluidos costes, beneficios, equipo y suscripción.
2. Vendedor: registra y consulta sus ventas; no ve costes ni las ventas de otros.
3. Almacén: ve el stock y los envíos y marca los envíos; no ve costes ni crea ventas.

Con «Permisos» puedes ajustar lo que ve cada persona. Solo los administradores ven esta pantalla.`),
      },
      {
        id: "responsables",
        q: msg("¿Qué es un responsable?"),
        tags: "responsable vendedor quién",
        a: msg(`Es la persona a la que se le apunta cada venta, para saber cuánto vende cada uno. Los creas en [Responsables](/responsables), donde también ves su ranking. Las opciones de los desplegables (plataformas, transportistas, móviles…) se editan en [Listas](/ajustes).`),
      },
      {
        id: "suscripcion",
        q: msg("¿Cómo funciona la suscripción? ¿Qué pasa si cancelo?"),
        tags: "suscripción pago precio cancelar factura prueba",
        a: msg(`Al crear tu espacio tienes unos días de prueba gratis. En [Suscripción](/suscripcion) ves el estado y gestionas el pago, las facturas o la cancelación.

Cancelar no borra tus datos: el espacio pasa a solo lectura y puedes descargar una copia completa cuando quieras. Si pides eliminar el espacio, tienes 30 días para arrepentirte.`),
      },
      {
        id: "preferencias",
        q: msg("¿Cómo cambio el tema, el formato o mi contraseña?"),
        tags: "tema oscuro claro contraseña formato configuración",
        a: msg(`En el ordenador, el modo claro y el oscuro se cambian con los botones del sol y la luna de la barra lateral; también en [Personalizar aspecto](/configuracion/aspecto). El formato regional y el resto de preferencias están en [Configuración](/configuracion), y tu contraseña en [Mi cuenta](/cuenta).`),
      },
    ],
  },
];

/** Texto plano de toda la ayuda (para la IA). */
export function faqAsText(t: (s: string) => string = (s) => s): string {
  return FAQ.map(
    (g) =>
      `## ${t(g.title)}\n` +
      g.items.map((f) => `### ${t(f.q)}\n${t(f.a).replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, "$1 ($2)")}`).join("\n\n"),
  ).join("\n\n");
}
