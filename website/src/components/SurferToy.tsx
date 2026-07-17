"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

/**
 * Mini surfer on a bouncing wave with spray and board tricks.
 * Used inside the floating WhatsApp control.
 */
export function SurferToy() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <span className="surfer-toy relative block h-16 w-16 overflow-hidden rounded-full border border-line bg-[#0a3a4a] shadow-xl shadow-black/25">
      {/* Sky wash */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#7ec8e3] via-[#3a8fb0] to-[#0a3a4a]" />

      {/* Rolling wave layers */}
      <svg
        className="surfer-toy__wave surfer-toy__wave--back pointer-events-none absolute inset-x-[-40%] bottom-0 h-[70%] w-[180%]"
        viewBox="0 0 200 80"
        aria-hidden
      >
        <path
          fill="#1f6f8b"
          d="M0 40 C20 20, 40 60, 60 40 S100 20, 120 40 S160 60, 180 40 S200 20, 220 40 V80 H0 Z"
        />
      </svg>
      <svg
        className="surfer-toy__wave surfer-toy__wave--front pointer-events-none absolute inset-x-[-30%] bottom-0 h-[58%] w-[160%]"
        viewBox="0 0 200 70"
        aria-hidden
      >
        <path
          fill="#2f9bb8"
          d="M0 36 C25 12, 45 58, 70 34 S115 10, 140 36 S175 58, 200 34 V70 H0 Z"
        />
        <path
          fill="#e8f7ff"
          opacity="0.55"
          d="M0 40 C25 22, 45 52, 70 38 S115 20, 140 40 S175 52, 200 38"
          stroke="#e8f7ff"
          strokeWidth="2"
          fillOpacity="0"
        />
      </svg>

      {/* Foam crest */}
      <span className="surfer-toy__foam pointer-events-none absolute bottom-[28%] left-[-10%] h-2 w-[120%] rounded-full bg-white/70 blur-[1px]" />

      {/* Water spray droplets */}
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="surfer-toy__splash pointer-events-none absolute bottom-[32%] left-1/2 h-1.5 w-1.5 rounded-full bg-white/90"
          style={{ "--i": i } as CSSProperties}
        />
      ))}

      {/* Rider + board unit */}
      <span className="surfer-toy__rider pointer-events-none absolute left-1/2 top-[10%] z-10 flex w-10 -translate-x-1/2 flex-col items-center">
        <Image
          src={toySrc}
          alt=""
          width={72}
          height={96}
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="surfer-toy__surfer h-9 w-auto object-contain drop-shadow-sm"
        />
        <svg
          className="surfer-toy__board -mt-0.5 h-2.5 w-11 drop-shadow"
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
          <path
            d="M36 4.5 H52"
            stroke="#e36f43"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {/* Soft vignette so the circle reads cleanly */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
    </span>
  );
}
