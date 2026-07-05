"use client";

import Image from "next/image";
import { useState } from "react";
import { whatsappHref } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { WhatsappIcon } from "@/components/icons";

export function FloatingWhatsApp() {
  const { t } = useLanguage();
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-end gap-2"
    >
      {/* Periodic speech bubble */}
      <span className="animate-bubble pointer-events-none relative mb-4 hidden rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-lg shadow-black/15 sm:block">
        {t.whatsapp.bubble}
        <span className="absolute -bottom-1.5 right-3 h-3 w-3 rotate-45 bg-white" />
      </span>

      {/* Toy button */}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white shadow-xl shadow-black/20 transition group-hover:scale-105">
        <Image
          src={toySrc}
          alt="Jhonny"
          width={120}
          height={150}
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="animate-toy h-14 w-auto object-contain"
        />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md ring-2 ring-white">
          <WhatsappIcon className="h-4 w-4" />
        </span>
      </span>
    </a>
  );
}
