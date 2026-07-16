import { waShareUrl } from "@/lib/whatsapp";

/**
 * Opens WhatsApp with a prefilled message — the coach picks the team group
 * and hits send. Plain anchor; works on mobile (app) and desktop (web).
 */
export function WhatsAppButton({
  text,
  label = "Share to WhatsApp",
  small = false,
}: {
  text: string;
  label?: string;
  small?: boolean;
}) {
  return (
    <a
      href={waShareUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] font-semibold text-white transition hover:bg-[#1DA851] ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      📤 {label}
    </a>
  );
}
