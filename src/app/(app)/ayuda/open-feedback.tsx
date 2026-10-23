"use client";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui";
import { openFeedback } from "@/components/feedback-trigger";

export function OpenFeedbackButton() {
  return (
    <Button onClick={() => openFeedback()}>
      <MessageSquarePlus size={16} strokeWidth={1.75} />
      Enviar feedback
    </Button>
  );
}
