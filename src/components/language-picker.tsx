"use client";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/i18n/actions";
import { useT } from "@/i18n/client";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { clsx } from "./ui";

/** Selector de idioma. Se aplica al momento y se guarda (en este navegador y, con sesión, en tu cuenta). */
export function LanguagePicker({ current, compact, className }: { current: Locale; compact?: boolean; className?: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className={clsx("relative inline-flex items-center", className)}>
      <span className="sr-only">{t("Idioma")}</span>
      <Languages size={compact ? 15 : 17} strokeWidth={1.75} className="pointer-events-none absolute left-3 text-faint" aria-hidden />
      <select
        value={current}
        disabled={pending}
        onChange={(e) => {
          const l = e.target.value;
          start(async () => {
            await setLanguage(l);
            router.refresh();
          });
        }}
        className={clsx(
          "appearance-none rounded-[var(--radius-sm)] border border-line-strong bg-surface-2 pr-9 font-medium text-ink outline-none focus:border-brand disabled:opacity-60",
          compact ? "h-9 pl-8 text-[13px]" : "h-11 w-full pl-10 text-[15px] sm:h-10 sm:text-[14px]",
        )}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l as Locale]}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-faint">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
