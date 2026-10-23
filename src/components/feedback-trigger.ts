/** Abre la ventana de feedback desde cualquier pantalla (la escucha el menú). */
export const FEEDBACK_EVENT = "rs:feedback";
export function openFeedback() {
  window.dispatchEvent(new Event(FEEDBACK_EVENT));
}
