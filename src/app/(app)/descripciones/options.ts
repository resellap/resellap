/** Opciones del generador (compartidas entre la pantalla y el servidor). */

import { msg } from "@/i18n/translate";
export const TONES = {
  profesional: { label: msg("Profesional"), hint: msg("Cuidada, clara y comercial") },
  natural: { label: msg("Natural"), hint: msg("Cercana, humana y directa") },
  informal: { label: msg("Informal"), hint: msg("Desenfadada, sin sonar artificial") },
  premium: { label: msg("Premium"), hint: msg("Calidad y diseño, sin exagerar") },
  tecnico: { label: msg("Técnico"), hint: msg("Materiales y datos verificables") },
} as const;
export type Tone = keyof typeof TONES;

export const PLATFORMS = {
  wallapop: "Wallapop",
  vinted: "Vinted",
  ebay: "eBay",
  instagram: "Instagram",
  facebook: "Facebook Marketplace",
  milanuncios: "Milanuncios",
  otra: msg("Otra plataforma"),
} as const;
export type PlatformKey = keyof typeof PLATFORMS;

export const LENGTHS = {
  corta: msg("Corta"),
  media: msg("Media"),
  detallada: msg("Detallada"),
} as const;
export type Length = keyof typeof LENGTHS;

export const CONDITIONS = [
  msg("Nuevo con etiquetas"),
  msg("Nuevo sin etiquetas"),
  msg("Nuevo, sin usar"),
  msg("Como nuevo"),
  msg("Muy buen estado"),
  msg("Buen estado"),
  msg("Usado, con señales de uso"),
  msg("Para piezas o reparar"),
] as const;

/** Datos que el usuario puede completar o corregir para cada producto (no se guardan en la ficha). */
export type ProductDetails = {
  brand: string;
  model: string;
  category: string;
  variant: string;
  frameColor: string;
  lens: string;
  condition: string;
  features: string;
  defects: string;
  accessories: string;
  price: string;
  extra: string;
};

export const MAX_PRODUCTS = 5;
export const MAX_FIELD = 300;
export const MAX_LONG_FIELD = 800;
