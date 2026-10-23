"use client";
import { useT } from "@/i18n/client";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui";
import { openFeedback } from "@/components/feedback-trigger";

export function OpenFeedbackButton() {
  const t = useT();
  return (
    <Button onClick={() => openFeedback()}>
      <MessageSquarePlus size={16} strokeWidth={1.75} />
      {t("Enviar feedback")}
    </Button>
  );
}
