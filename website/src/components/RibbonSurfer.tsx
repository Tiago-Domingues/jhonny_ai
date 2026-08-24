"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Tiny Jhonny riding the corner ribbon's hypotenuse.
 *
 * Travel, tilt and bob are three separate transforms composed by CSS
 * (`jss-ribbon-surf` on the traveller, `toy-bob` on the inner wrapper), so he
 * rides the swell while descending instead of sliding as a rigid sprite.
 * Purely decorative: `aria-hidden` and click-transparent so the triangle
 * underneath stays fully usable.
 */
export function RibbonSurfer() {
  const [riderSrc, setRiderSrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <span className="jss-ribbon-surfer" aria-hidden="true" data-testid="ribbon-surfer">
      <span className="jss-ribbon-surfer__bob">
        <Image
          src={riderSrc}
          alt=""
          width={72}
          height={96}
          onError={() => setRiderSrc("/brand/jhonny-character-cut.svg")}
          className="jss-ribbon-surfer__rider"
        />
        <svg
          className="jss-ribbon-surfer__board"
          viewBox="-40 0 168 15"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="ribbonBoardGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f7d46f" />
              <stop offset="55%" stopColor="#fff7e8" />
              <stop offset="100%" stopColor="#e36f43" />
            </linearGradient>
            {/* Wake fades out behind the tail rather than ending abruptly. */}
            <linearGradient id="ribbonSprayGrad" x1="1" x2="0" y1="0" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M4 5 C -6 2, -14 1.5, -24 3"
            stroke="url(#ribbonSprayGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M4 10 C -8 10, -18 11.5, -30 11"
            stroke="url(#ribbonSprayGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          <ellipse cx="44" cy="7" rx="42" ry="5.5" fill="url(#ribbonBoardGrad)" />
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
    </span>
  );
}
