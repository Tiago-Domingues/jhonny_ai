"use client";

import { useEffect, useState } from "react";
import { InstagramIcon } from "@/components/icons";

type InstagramMedia = {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  fallback?: boolean;
};

export function InstagramMediaStrip({
  handle,
  label,
  className = "",
}: {
  handle: string;
  label: string;
  className?: string;
}) {
  const [media, setMedia] = useState<InstagramMedia[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/instagram/${encodeURIComponent(handle)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setMedia(data?.media || []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const fallback = Array.from({ length: 3 }, (_, index) => ({
    id: `${handle}-fallback-${index}`,
    permalink: `https://www.instagram.com/${handle}/`,
    mediaUrl: "",
    fallback: true,
  }));
  const items = media.length ? media : fallback;

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
        <a
          href={`https://www.instagram.com/${handle}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink"
        >
          <InstagramIcon className="h-3.5 w-3.5" />
          @{handle}
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => (
          <a
            key={item.id}
            href={item.permalink || `https://www.instagram.com/${handle}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${handle} Instagram post ${index + 1}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-ink"
          >
            {item.mediaUrl ? (
              <span
                className="absolute inset-0 bg-cover bg-center transition duration-500 hover:scale-105"
                style={{ backgroundImage: `url("${item.mediaUrl}")` }}
              />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#111] via-[#1f1f1f] to-[#5c554c] p-3 text-center transition duration-300 group-hover:scale-105">
                <InstagramIcon className="h-6 w-6 text-white/80" />
                <span className="mt-2 text-[0.6rem] font-bold uppercase tracking-wide text-white/70">
                  Open post
                </span>
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
