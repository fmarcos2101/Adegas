const WHATSAPP_NUMBER = "5564992903947";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Preciso de suporte com o sistema Adega Faixa Rosa.",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export function SupportButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Suporte via WhatsApp"
      title="Suporte — fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-2xl font-bold text-white shadow-lg ring-4 ring-pink-600/20 transition-transform hover:scale-105 hover:bg-pink-700 active:scale-95"
    >
      ?
    </a>
  );
}
