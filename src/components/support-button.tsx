import { APP_NAME } from "@/lib/constants";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Olá! Preciso de suporte com o ${APP_NAME}.`,
);

export function SupportButton() {
  if (!WHATSAPP_NUMBER) return null;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Suporte via WhatsApp"
      title="Suporte — fale conosco no WhatsApp"
      className="maf-chrome-btn fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold transition hover:brightness-105 active:scale-95"
    >
      ?
    </a>
  );
}
