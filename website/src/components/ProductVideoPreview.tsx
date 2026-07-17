"use client";

import { youtubeVideoId } from "@/lib/ecommerce/surfboardModelCatalog";

export function ProductVideoPreview({
  videoUrl,
  title,
}: {
  videoUrl?: string | null;
  title: string;
}) {
  if (!videoUrl) return null;

  const id = youtubeVideoId(videoUrl);

  if (!id) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex rounded-full border border-line bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-cream"
      >
        Watch product video
      </a>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-ink shadow-sm">
      <div className="relative aspect-video w-full bg-black">
        <iframe
          title={`${title} — product video`}
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/70">
          Product video preview
        </p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-wide text-white underline underline-offset-4"
        >
          Open on YouTube
        </a>
      </div>
    </div>
  );
}
