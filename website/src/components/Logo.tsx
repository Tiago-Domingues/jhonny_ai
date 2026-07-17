import Image from "next/image";

type LogoType = "horizontal" | "stacked" | "wordmark" | "mark";

/** Official JSS brand marks (PNG with transparent background). */
const SOURCES: Record<LogoType, { src: string; w: number; h: number }> = {
  horizontal: { src: "/brand/logo-horizontal.png", w: 1024, h: 384 },
  stacked: { src: "/brand/logo-stacked.png", w: 1024, h: 720 },
  wordmark: { src: "/brand/logo-wordmark.png", w: 1024, h: 300 },
  mark: { src: "/brand/logo-mark.png", w: 1024, h: 950 },
};

export function Logo({
  type = "horizontal",
  variant = "light",
  className = "",
  priority = false,
}: {
  type?: LogoType;
  /** Use `dark` on black/ink backgrounds to render the mark in white. */
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
      className={`${variant === "dark" ? "logo-invert" : ""} w-auto ${className}`}
    />
  );
}
