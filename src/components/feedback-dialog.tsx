"use client";
/**
 * Ventana de feedback: idea, fallo u otra cosa, con captura opcional.
 * Se carga solo cuando alguien la abre (no pesa en el resto de la app).
 */
import { Bug, ImagePlus, Lightbulb, LoaderCircle, MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { feedbackFolder, sendFeedback } from "@/app/(app)/ayuda/actions";
import { prepareImage } from "@/lib/image";
import { Button, clsx, Notice } from "./ui";
import { Modal } from "./ui-client";

const KINDS = [
  { key: "idea", label: "Idea", icon: Lightbulb, hint: "¿Qué te gustaría que hiciera Resellap?" },
  { key: "fallo", label: "Algo falla", icon: Bug, hint: "¿Qué ha pasado y qué esperabas que pasara?" },
  { key: "otro", label: "Otra cosa", icon: MessageCircle, hint: "Cuéntanos lo que quieras." },
] as const;

export default function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const page = usePathname();
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("idea");
  const [message, setMessage] = useState("");
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const close = () => {
    onClose();
    // Al volver a abrir, empieza de cero
    setTimeout(() => {
      setDone(false);
      setMessage("");
      setError(null);
      if (shot) URL.revokeObjectURL(shot.url);
      setShot(null);
      setKind("idea");
    }, 300);
  };

  const submit = () =>
    start(async () => {
      setError(null);
      let screenshot: string | undefined;
      if (shot) {
        try {
          const folder = await feedbackFolder();
          if (!folder) throw new Error("sesión");
          const img = await prepareImage(shot.file, 1800);
          const path = `${folder}/${crypto.randomUUID()}.jpg`;
          const supabase = (await import("@/lib/supabase/client")).createClient();
          const { error: up } = await supabase.storage.from("feedback").upload(path, img.blob, { contentType: "image/jpeg" });
          if (up) throw new Error(up.message);
          screenshot = path;
        } catch {
          setError("No se ha podido subir la captura. Quítala o prueba con otra imagen.");
          return;
        }
      }
      const r = await sendFeedback({ kind, message, page, screenshot });
      if (!r.ok) return setError(r.error);
      setDone(true);
    });

  const current = KINDS.find((k) => k.key === kind)!;

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? "¡Gracias!" : "Enviar feedback"}
      footer={
        done ? (
          <Button variant="primary" onClick={close}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={close}>Cancelar</Button>
            <Button variant="primary" onClick={submit} disabled={pending || message.trim().length < 3}>
              {pending && <LoaderCircle size={16} className="animate-spin" />}
              {pending ? "Enviando…" : "Enviar"}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-[15px] leading-relaxed text-ink-soft">Lo hemos recibido. Cada mensaje lo lee una persona y nos ayuda a mejorar Resellap.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Tipo de mensaje" className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                role="radio"
                aria-checked={kind === k.key}
                onClick={() => setKind(k.key)}
                className={clsx(
                  "press flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border text-[13px] font-medium transition-colors",
                  kind === k.key ? "border-brand bg-brand/10 text-ink" : "border-line bg-surface-2 text-muted hover:text-ink",
                )}
              >
                <k.icon size={18} strokeWidth={1.75} className={kind === k.key ? "text-brand" : undefined} />
                {k.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-muted">{current.hint}</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              autoFocus
              className="min-h-28 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
          </label>
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (shot) URL.revokeObjectURL(shot.url);
                setShot({ file: f, url: URL.createObjectURL(f) });
              }}
            />
            {shot ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
                <img src={shot.url} alt="Captura adjunta" className="h-16 w-24 rounded-[var(--radius-xs)] border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(shot.url);
                    setShot(null);
                  }}
                  className="press flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-[13px] font-medium text-muted hover:text-ink"
                >
                  <X size={15} strokeWidth={2} />
                  Quitar captura
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="press flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-1 text-[13.5px] font-medium text-brand-ink hover:underline"
              >
                <ImagePlus size={16} strokeWidth={1.75} />
                Adjuntar una captura (opcional)
              </button>
            )}
          </div>
          <p className="text-xs text-faint">
            Se enviará también la pantalla en la que estás (<span className="mono">{page}</span>) para entenderlo mejor.
          </p>
          {error && <Notice tone="bad">{error}</Notice>}
        </div>
      )}
    </Modal>
  );
}
