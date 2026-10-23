import { Tx } from "@/i18n/tx";
import { PO_STATUS } from "@/lib/format";
import { Badge } from "./ui";

export function POStatus({ status }: { status: string }) {
  return <Badge tone={status === "recibido" ? "good" : status === "pendiente" ? "warn" : "neutral"}><Tx>{PO_STATUS[status] ?? status}</Tx></Badge>;
}
