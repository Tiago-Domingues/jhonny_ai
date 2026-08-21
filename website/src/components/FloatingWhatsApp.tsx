"use client";

import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/i18n";
import { WhatsappIcon } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";

export function FloatingWhatsApp() {
  const { locale } = useLanguage();
  return (
    <a
      href={whatsappHref(WHATSAPP_MESSAGES[locale])}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      data-testid="whatsapp-float"
      className="fixed bottom-5 right-5 z-50"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md ring-2 ring-white transition hover:scale-105">
        <WhatsappIcon className="h-4 w-4" />
      </span>
    </a>
  );
}
