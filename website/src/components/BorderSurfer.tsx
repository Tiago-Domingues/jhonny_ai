"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Horizontal wave-border surfer: rides left → right with carve, spray, and board.
 */
export function BorderSurfer() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <div className="border-surfer relative h-14 w-24">
      {/* Local wave under the rider */}
      <svg
        className="border-surfer__local-wave pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full"
        viewBox="0 0 120 32"
        aria-hidden
      >
        <path
          d="M0 22 C18 10, 34 28, 52 16 S86 6, 120 18 V32 H0 Z"
          fill="#2f9bb8"
          opacity="0.95"
        />
        <path
          d="M0 24 C22 14, 40 26, 58 18 S96 10, 120 20"
          fill="none"
          stroke="#e8f7ff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>

      {/* Spray / water splits */}
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="border-surfer__splash pointer-events-none absolute bottom-3 left-4 h-1.5 w-1.5 rounded-full bg-white"
          style={{ ["--i" as string]: i }}
        />
      ))}

      {/* Rider + board */}
      <div className="border-surfer__rider absolute bottom-2 left-1/2 z-10 flex w-14 -translate-x-1/2 flex-col items-center">
        <Image
          src={toySrc}
          alt=""
          width={56}
          height={72}
          unoptimized
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="border-surfer__body h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
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
            stroke="#10323f"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}
