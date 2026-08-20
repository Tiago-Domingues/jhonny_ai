"use client";

import { whatsappHref } from "@/lib/i18n";
import { WhatsappIcon } from "@/components/icons";
import { SurferToy } from "@/components/SurferToy";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      data-testid="whatsapp-float"
      className="fixed bottom-5 right-5 z-50"
    >
      <span className="jss-wa-toy pointer-events-none absolute bottom-[108%] left-1/2">
        <SurferToy />
      </span>
      <WhatsappIcon className="h-12 w-12 text-[#25D366] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition hover:scale-105" />
    </a>
  );
}
