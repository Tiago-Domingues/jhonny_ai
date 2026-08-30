"use client";

import { useLanguage } from "@/components/LanguageProvider";

/**
 * Second homepage: line-art of the Surf Essentials aisle.
 * Jhonny stays behind the balcão; clients enter, talk, and leave.
 */
export function HeroStoreScene() {
  const { t } = useLanguage();
  const chats = t.hero.storeChats;

  return (
    <div className="hero-store" aria-hidden>
      <svg
        className="hero-store__stage"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        {/* Ceiling beams + hung longboards */}
        <path d="M80 70 H1520 M80 118 H1520 M80 166 H1520" stroke="#0d0d0d" strokeWidth="2.2" />
        <g className="hero-store__hung">
          <rect x="220" y="78" width="380" height="28" rx="14" fill="#0d0d0d" />
          <rect x="640" y="126" width="420" height="26" rx="13" fill="none" stroke="#0d0d0d" strokeWidth="2" />
          <rect x="1100" y="86" width="340" height="24" rx="12" fill="#0d0d0d" />
        </g>

        {/* Left pillar + ladder + bottle shelf */}
        <rect x="118" y="180" width="46" height="430" fill="none" stroke="#0d0d0d" strokeWidth="2" />
        <g className="hero-store__ladder">
          <path d="M200 250 L248 610 M278 250 L326 610" stroke="#0d0d0d" strokeWidth="2" />
          <path
            d="M214 300 H292 M222 360 H300 M230 420 H308 M238 480 H316 M246 540 H324"
            stroke="#0d0d0d"
            strokeWidth="1.6"
          />
          <path d="M218 292 H288 M226 352 H296 M234 412 H304" stroke="#0d0d0d" strokeWidth="6" opacity="0.18" />
        </g>
        <g>
          <path d="M348 250 V610 M430 250 V610" stroke="#0d0d0d" strokeWidth="1.8" />
          {[270, 330, 390, 450, 510, 570].map((y) => (
            <g key={y}>
              <path d={`M348 ${y} H430`} stroke="#0d0d0d" strokeWidth="1.4" />
              <circle cx="372" cy={y - 14} r="7" fill="none" stroke="#0d0d0d" strokeWidth="1.3" />
              <circle cx="406" cy={y - 16} r="6" fill="none" stroke="#0d0d0d" strokeWidth="1.3" />
            </g>
          ))}
        </g>

        {/* Back shelves */}
        <path
          d="M470 250 H1080 M470 310 H1080 M470 370 H1080"
          stroke="#0d0d0d"
          strokeWidth="1.2"
          opacity="0.45"
        />

        {/* Vertical boards behind / right of balcão */}
        <g className="hero-store__rack">
          {[
            [1090, 220, 20, 300],
            [1118, 208, 18, 312],
            [1142, 228, 22, 292],
            [1172, 200, 19, 320],
            [1198, 216, 21, 304],
            [1226, 206, 17, 314],
            [1250, 230, 20, 290],
            [1278, 212, 18, 308],
            [1302, 224, 22, 296],
            [1332, 204, 16, 316],
          ].map(([x, y, w, h], i) => (
            <rect
              key={x}
              className={`hero-store__board hero-store__board--${i}`}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={w / 2}
              fill={i % 3 === 0 ? "#0d0d0d" : "none"}
              stroke="#0d0d0d"
              strokeWidth="1.6"
            />
          ))}
        </g>

        {/* Apparel rail */}
        <g>
          <path d="M1388 250 H1540 M1388 250 V610" stroke="#0d0d0d" strokeWidth="1.8" />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              className={`hero-store__suit hero-store__suit--${i}`}
              d={`M${1410 + i * 32} 250 V278 C${1400 + i * 32} 330, ${1402 + i * 32} 390, ${1410 + i * 32} 430 C${1420 + i * 32} 390, ${1422 + i * 32} 330, ${1412 + i * 32} 278`}
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="1.6"
            />
          ))}
        </g>

        <g className="hero-store-jhonny">
          <image
            href="/brand/jhonny-character-cut.png"
            x="755"
            y="332"
            width="92"
            height="140"
          />
        </g>

        {/* Balcão — drawn over Jhonny so he stands behind it */}
        <g className="hero-store__counter">
          <path d="M430 470 H1180 V620 H430 Z" fill="#e8e2d0" stroke="#0d0d0d" strokeWidth="2.6" />
          <path
            d="M430 494 H1180 M430 518 H1180 M430 542 H1180 M430 566 H1180 M430 590 H1180"
            stroke="#0d0d0d"
            strokeWidth="1.15"
            opacity="0.42"
          />
          <text
            x="498"
            y="568"
            fill="#0d0d0d"
            fontFamily="var(--font-montserrat), Montserrat, sans-serif"
            fontSize="54"
            fontWeight="800"
            letterSpacing="-2"
          >
            JH
          </text>
          <rect x="620" y="492" width="500" height="108" fill="none" stroke="#0d0d0d" strokeWidth="2" />
          <path
            className="hero-store__swell"
            d="M640 560 C700 530, 760 590, 820 552 C880 516, 940 588, 1000 548 C1048 520, 1088 566, 1104 558"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="2"
          />
          <path
            className="hero-store__swell hero-store__swell--late"
            d="M648 582 C720 562, 790 600, 860 574 C930 548, 1000 602, 1096 580"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="1.4"
            opacity="0.7"
          />
        </g>

        {/* Round tables + rug */}
        <ellipse cx="800" cy="760" rx="210" ry="70" fill="none" stroke="#0d0d0d" strokeWidth="1.5" />
        <ellipse cx="800" cy="760" rx="168" ry="52" fill="none" stroke="#0d0d0d" strokeWidth="1" opacity="0.4" />
        <g className="hero-store__table">
          <ellipse cx="640" cy="708" rx="78" ry="22" fill="none" stroke="#0d0d0d" strokeWidth="2" />
          <path d="M590 708 V748 M640 730 V756 M690 708 V748" stroke="#0d0d0d" strokeWidth="1.6" />
        </g>
        <g className="hero-store__table">
          <ellipse cx="960" cy="708" rx="78" ry="22" fill="none" stroke="#0d0d0d" strokeWidth="2" />
          <path d="M910 708 V748 M960 730 V756 M1010 708 V748" stroke="#0d0d0d" strokeWidth="1.6" />
        </g>

        {/* Floor lines */}
        <path
          d="M80 620 H1520 M200 700 H1400 M320 780 H1280"
          stroke="#0d0d0d"
          strokeWidth="1"
          opacity="0.18"
        />

      </svg>

      <div className="hero-store-people">
        <div className="hero-store-client hero-store-client--shopper">
          <LineClient bag={false} />
        </div>
        <div className="hero-store-client hero-store-client--buyer">
          <LineClient bag />
        </div>
      </div>

      <div className="hero-store-chats">
        {chats.map((chat, index) => (
          <div key={chat.jhonny} className={`hero-store-chat hero-store-chat--${index}`}>
            <p className="hero-store-balloon hero-store-balloon--jhonny">{chat.jhonny}</p>
            <p className="hero-store-balloon hero-store-balloon--client">{chat.client}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineClient({ bag }: { bag: boolean }) {
  return (
    <svg viewBox="-22 -52 64 92" className="hero-store-client__svg" aria-hidden>
      <circle cx="0" cy="-38" r="11" fill="none" stroke="#0d0d0d" strokeWidth="2" />
      <path
        d="M0 -26 V8 M0 -12 L-16 4 M0 -12 L16 4 M0 8 L-12 34 M0 8 L12 34"
        fill="none"
        stroke="#0d0d0d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {bag ? (
        <path
          className="hero-store-client__bag"
          d="M18 6 H34 V28 H18 Z M20 6 C20 -2, 32 -2, 32 6"
          fill="#0d0d0d"
          stroke="#0d0d0d"
          strokeWidth="1.4"
        />
      ) : null}
    </svg>
  );
}
