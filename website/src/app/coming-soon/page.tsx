import type { Metadata } from "next";
import Image from "next/image";
import { STORE, whatsappHref } from "@/lib/i18n";
import { InstagramIcon, WhatsappIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Em construção · Under construction",
  description:
    "Jhonny Surf Store — o nosso site está em construção. Visita-nos em Carcavelos ou fala connosco. Our website is under construction.",
  robots: { index: false, follow: false },
};

export default function ComingSoon() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-16 text-center text-ink">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Wordmark */}
        <Image
          src="/brand/logo-stacked.png"
          alt="Jhonny Surf Store"
          width={1024}
          height={720}
          priority
          className="h-auto w-44 sm:w-52"
        />

        {/* Animated toy logo */}
        <div className="relative mt-8 flex h-44 w-44 items-center justify-center">
          <span className="absolute bottom-3 h-4 w-28 rounded-full bg-black/10 blur-md" />
          <Image
            src="/brand/jhonny-character-cut.svg"
            alt="Jhonny"
            width={240}
            height={300}
            priority
            className="animate-toy h-40 w-auto object-contain"
          />
        </div>

        {/* Message */}
        <h1 className="font-display mt-8 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Estamos a preparar algo bom.
        </h1>
        <p className="mt-2 text-base text-muted">We&apos;re shaping something good.</p>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
          Site em construção · Under construction
        </p>

        {/* Contact links */}
        <div className="mt-10 flex items-center gap-3">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:scale-105 hover:text-[#25D366]"
          >
            <WhatsappIcon className="h-5 w-5" />
          </a>
          <a
            href={STORE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:scale-105 hover:text-[#E1306C]"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        </div>

        <p className="mt-6 text-sm text-muted">{STORE.region}</p>
      </div>
    </main>
  );
}
