"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { InstagramIcon } from "@/components/icons";

type InstagramMedia = {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  fallback?: boolean;
};

const staticDudesMedia: InstagramMedia[] = [
  {
    id: "3766550636138336821",
    mediaUrl: "/brand/partners/dudes-post-1.jpg",
    permalink: "https://www.instagram.com/p/DRFedj3jBI1/",
  },
  {
    id: "3741106343957286859",
    mediaUrl: "/brand/partners/dudes-post-2.jpg",
    permalink: "https://www.instagram.com/p/DPrFGYKiM_L/",
  },
  {
    id: "3738826267194586160",
    mediaUrl: "/brand/partners/dudes-post-3.jpg",
    permalink: "https://www.instagram.com/p/DPi-q5NCHQw/",
  },
];

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
  const items = media.length
    ? media
    : handle === "dudes_surfcafe"
      ? staticDudesMedia
      : fallback;

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
              <Image
                src={item.mediaUrl}
                alt={`${handle} Instagram post ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 180px, 33vw"
                unoptimized
                className="object-cover transition duration-500 group-hover:scale-105"
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
