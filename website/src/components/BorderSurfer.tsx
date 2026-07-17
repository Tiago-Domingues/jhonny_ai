"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Horizontal edge surfer: rides left → right along the white/black wave seam.
 * Jhonny stands on the board — no foam line or splash dots.
 */
export function BorderSurfer() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <div className="border-surfer relative h-14 w-24">
      {/* Subtle black lip under the board — reads as the wave edge */}
      <svg
        className="border-surfer__local-wave pointer-events-none absolute inset-x-1 bottom-1 h-5 w-[calc(100%-0.5rem)]"
        viewBox="0 0 120 20"
        aria-hidden
      >
        <path
          d="M0 12 C20 4, 40 16, 60 8 S100 2, 120 10 V20 H0 Z"
          fill="#0d0d0d"
        />
      </svg>

      {/* Rider surfing on the board */}
      <div className="border-surfer__rider absolute bottom-1 left-1/2 z-10 flex w-16 -translate-x-1/2 flex-col items-center">
        <Image
          src={toySrc}
          alt=""
          width={64}
          height={80}
          unoptimized
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="border-surfer__body relative z-10 -mb-3 h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        />
        <svg
          className="border-surfer__board relative z-0 h-3 w-16 drop-shadow"
          viewBox="0 0 96 14"
          aria-hidden
        >
          <defs>
            <linearGradient id="borderBoardGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#f7d46f" />
              <stop offset="50%" stopColor="#fff7e8" />
              <stop offset="100%" stopColor="#e36f43" />
            </linearGradient>
          </defs>
          <ellipse cx="48" cy="7" rx="46" ry="5.2" fill="url(#borderBoardGrad)" />
        </svg>
      </div>
    </div>
  );
}
