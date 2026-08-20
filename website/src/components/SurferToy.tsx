"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Mini Jhonny-on-a-board. Pops above the WhatsApp mark every 10s.
 * No circular ocean frame — just the character and board.
 */
export function SurferToy() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <span className="surfer-toy pointer-events-none relative flex w-11 flex-col items-center">
      <Image
        src={toySrc}
        alt=""
        width={72}
        height={96}
        onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
        className="surfer-toy__surfer h-8 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
      />
      <svg
        className="surfer-toy__board -mt-0.5 h-2 w-9 drop-shadow"
        viewBox="0 0 88 14"
        aria-hidden
      >
        <defs>
          <linearGradient id="boardGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f7d46f" />
            <stop offset="55%" stopColor="#fff7e8" />
            <stop offset="100%" stopColor="#e36f43" />
          </linearGradient>
        </defs>
        <ellipse cx="44" cy="7" rx="42" ry="5.5" fill="url(#boardGrad)" />
        <path
          d="M10 7 H78"
          stroke="#10323f"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path d="M36 4.5 H52" stroke="#e36f43" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
