import Image from "next/image";

type LogoType = "horizontal" | "stacked" | "wordmark" | "mark";

/** Colored brand logos (SVG). Never invert to black/white. */
const SOURCES: Record<LogoType, { src: string; w: number; h: number }> = {
  horizontal: { src: "/brand/logo-horizontal.svg", w: 1024, h: 384 },
  stacked: { src: "/brand/logo-stacked.svg", w: 1024, h: 720 },
  wordmark: { src: "/brand/logo-wordmark.svg", w: 1024, h: 300 },
  mark: { src: "/brand/logo-mark.svg", w: 1024, h: 950 },
};

export function Logo({
  type = "horizontal",
  className = "",
  priority = false,
}: {
  type?: LogoType;
  /** @deprecated Kept for call-site compatibility — logos always render in color. */
  variant?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  const { src, w, h } = SOURCES[type];
  return (
    <Image
      src={src}
      alt="Jhonny Surf Store"
      width={w}
      height={h}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}
