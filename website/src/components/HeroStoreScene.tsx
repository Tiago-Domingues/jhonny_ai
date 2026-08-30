"use client";

import Image from "next/image";

/**
 * Modular second homepage: cream paper + black line store, Jhonny toys inside.
 * Visual language matches the Terms page (paper ground, ink marks, open space).
 */
export function HeroStoreScene() {
  return (
    <div className="hero-store" aria-hidden>
      <svg
        className="hero-store__stage"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          <pattern id="hero-store-floor" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M0 48 H48" stroke="#0d0d0d" strokeWidth="0.6" opacity="0.12" />
          </pattern>
        </defs>

        {/* Floor */}
        <polygon
          className="hero-store__floor"
          points="0,620 1600,620 1600,900 0,900"
          fill="url(#hero-store-floor)"
        />
        <path d="M0 620 H1600" stroke="#0d0d0d" strokeWidth="2" />
        <path
          d="M180 620 L80 900 M500 620 L420 900 M820 620 L820 900 M1140 620 L1220 900 M1460 620 L1560 900"
          stroke="#0d0d0d"
          strokeWidth="1"
          opacity="0.22"
        />

        {/* Back wall + hanging sign */}
        <path d="M70 210 H1530" stroke="#0d0d0d" strokeWidth="1.6" />
        <rect x="620" y="128" width="360" height="58" fill="none" stroke="#0d0d0d" strokeWidth="2" />
        <text
          x="800"
          y="166"
          textAnchor="middle"
          fill="#0d0d0d"
          fontFamily="var(--font-montserrat), Montserrat, sans-serif"
          fontSize="22"
          fontWeight="800"
          letterSpacing="6"
        >
          JHONNY SURF STORE
        </text>

        {/* Street window — ocean line drawing */}
        <g className="hero-store__window">
          <rect x="96" y="230" width="420" height="340" fill="none" stroke="#0d0d0d" strokeWidth="2.4" />
          <path d="M306 230 V570 M96 400 H516" stroke="#0d0d0d" strokeWidth="1.4" />
          <path
            className="hero-store__horizon"
            d="M112 392 H500"
            stroke="#0d0d0d"
            strokeWidth="1.2"
            opacity="0.55"
          />
          <path
            className="hero-store__swell"
            d="M118 430 C170 412, 220 448, 274 428 C328 408, 378 446, 430 424 C470 410, 492 428, 500 434"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="1.6"
          />
          <path
            className="hero-store__swell hero-store__swell--late"
            d="M118 468 C176 452, 228 486, 286 466 C344 446, 392 484, 500 470"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="1.3"
            opacity="0.7"
          />
          <circle className="hero-store__sun" cx="430" cy="286" r="18" fill="none" stroke="#0d0d0d" strokeWidth="1.6" />
          <path
            className="hero-store__palm"
            d="M168 568 C168 500, 156 470, 148 430 M148 448 C118 430, 112 456, 128 470 M148 440 C178 418, 196 448, 176 468"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Door */}
        <g>
          <rect x="1388" y="268" width="132" height="352" fill="none" stroke="#0d0d0d" strokeWidth="2.2" />
          <rect x="1404" y="286" width="100" height="200" fill="none" stroke="#0d0d0d" strokeWidth="1.3" />
          <circle cx="1502" cy="450" r="5" fill="#0d0d0d" />
        </g>

        {/* Board rack */}
        <g className="hero-store__rack">
          <path d="M1088 250 V610 M1336 250 V610" stroke="#0d0d0d" strokeWidth="2.2" />
          <path d="M1074 268 H1350 M1074 596 H1350" stroke="#0d0d0d" strokeWidth="2" />
          {[
            [1102, 292, 22, 286],
            [1134, 276, 20, 302],
            [1164, 304, 21, 274],
            [1194, 268, 19, 310],
            [1222, 288, 22, 290],
            [1254, 274, 18, 304],
            [1282, 298, 21, 280],
            [1310, 282, 17, 296],
          ].map(([x, y, w, h], i) => (
            <g key={x} className={`hero-store__board hero-store__board--${i}`}>
              <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="#0d0d0d" />
              <path
                d={`M${x + w / 2} ${y + 18} V${y + h - 18}`}
                stroke="#f3f0e8"
                strokeWidth="1"
                opacity="0.35"
              />
            </g>
          ))}
        </g>

        {/* Wetsuit rail */}
        <g className="hero-store__suits">
          <path d="M560 248 H980" stroke="#0d0d0d" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => {
            const x = 600 + i * 96;
            return (
              <g key={i} className={`hero-store__suit hero-store__suit--${i}`} transform={`translate(${x} 248)`}>
                <path d="M0 0 V18" stroke="#0d0d0d" strokeWidth="1.6" />
                <path
                  d="M-22 22 C-26 70, -18 118, -10 168 M22 22 C26 70, 18 118, 10 168 M-22 22 H22 M-8 86 H8"
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </g>

        {/* Counter + coffee kiosk nod */}
        <g className="hero-store__counter">
          <path d="M540 548 H980 V620 H540 Z" fill="none" stroke="#0d0d0d" strokeWidth="2.2" />
          <path d="M560 548 V500 H780 V548" fill="none" stroke="#0d0d0d" strokeWidth="1.6" />
          <rect x="790" y="508" width="72" height="40" fill="none" stroke="#0d0d0d" strokeWidth="1.5" />
          <path d="M804 508 V492 M826 508 V488 M848 508 V494" stroke="#0d0d0d" strokeWidth="1.4" />
          <g className="hero-store__steam">
            <path d="M814 486 C808 476, 820 468, 814 458" fill="none" stroke="#0d0d0d" strokeWidth="1.2" />
            <path d="M832 482 C826 472, 838 464, 832 454" fill="none" stroke="#0d0d0d" strokeWidth="1.2" />
          </g>
          <text
            x="760"
            y="590"
            textAnchor="middle"
            fill="#0d0d0d"
            fontFamily="var(--font-montserrat), Montserrat, sans-serif"
            fontSize="13"
            fontWeight="700"
            letterSpacing="3"
          >
            WAX · FINS · ADVICE
          </text>
        </g>

        {/* Ceiling lamps */}
        <g className="hero-store__lamp hero-store__lamp--a">
          <path d="M250 0 V96" stroke="#0d0d0d" strokeWidth="1.4" />
          <path d="M222 96 H278 L264 128 H236 Z" fill="#0d0d0d" />
        </g>
        <g className="hero-store__lamp hero-store__lamp--b">
          <path d="M1350 0 V88" stroke="#0d0d0d" strokeWidth="1.4" />
          <path d="M1324 88 H1376 L1364 118 H1336 Z" fill="#0d0d0d" />
        </g>

        {/* Seagull */}
        <path
          className="hero-store__gull"
          d="M0 0 C12 -10, 22 -4, 28 0 C36 -12, 48 -8, 56 2"
          fill="none"
          stroke="#0d0d0d"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      <JhonnyToy
        className="hero-store-toy hero-store-toy--greet"
        width={118}
        height={178}
      />
      <JhonnyToy
        className="hero-store-toy hero-store-toy--ride"
        width={72}
        height={108}
      />
      <span className="hero-store-toy__board" />
      <JhonnyToy
        className="hero-store-toy hero-store-toy--hang"
        width={56}
        height={84}
      />
      <JhonnyToy
        className="hero-store-toy hero-store-toy--peek"
        width={64}
        height={96}
      />
    </div>
  );
}

function JhonnyToy({
  className,
  width,
  height,
}: {
  className: string;
  width: number;
  height: number;
}) {
  return (
    <span className={className}>
      <Image
        src="/brand/jhonny-character-cut.png"
        alt=""
        width={width}
        height={height}
        className="hero-store-toy__img"
      />
    </span>
  );
}
