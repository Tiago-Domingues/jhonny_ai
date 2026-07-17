"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Horizontal edge surfer: rides left → right along the white/black wave seam.
 */
export function BorderSurfer() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <div className="border-surfer relative h-14 w-24">
      {/* Thin black lip under the board — reads as the wave edge, not blue water */}
      <svg
        className="border-surfer__local-wave pointer-events-none absolute inset-x-1 bottom-1 h-5 w-[calc(100%-0.5rem)]"
        viewBox="0 0 120 20"
        aria-hidden
      >
        <path
          d="M0 12 C20 4, 40 16, 60 8 S100 2, 120 10 V20 H0 Z"
          fill="#0d0d0d"
        />
        <path
          d="M0 11 C22 5, 42 15, 62 9 S102 3, 120 11"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {/* Spray / foam splits — white against black */}
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="border-surfer__splash pointer-events-none absolute bottom-2 left-4 h-1.5 w-1.5 rounded-full bg-white"
          style={{ ["--i" as string]: i }}
        />
      ))}

      {/* Rider + board sitting on the seam */}
      <div className="border-surfer__rider absolute bottom-1.5 left-1/2 z-10 flex w-14 -translate-x-1/2 flex-col items-center">
        <Image
          src={toySrc}
          alt=""
          width={56}
          height={72}
          unoptimized
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="border-surfer__body h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        />
        <svg
          className="border-surfer__board -mt-0.5 h-2.5 w-14 drop-shadow"
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
          <path
            d="M12 7 H84"
            stroke="#0d0d0d"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  );
}
