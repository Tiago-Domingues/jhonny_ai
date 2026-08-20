"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";

const STORAGE_KEY = "jss-a11y-v1";

type A11ySettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

const DEFAULT_SETTINGS: A11ySettings = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
};

function readSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<A11ySettings>;
    return {
      largeText: Boolean(parsed.largeText),
      highContrast: Boolean(parsed.highContrast),
      reduceMotion: Boolean(parsed.reduceMotion),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applySettings(settings: A11ySettings) {
  const root = document.documentElement;
  root.classList.toggle("jss-a11y-lg", settings.largeText);
  root.classList.toggle("jss-a11y-contrast", settings.highContrast);
  root.classList.toggle("jss-a11y-motion", settings.reduceMotion);
}

type AccessibilityPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  largeTextLabel: string;
  highContrastLabel: string;
  reduceMotionLabel: string;
  resetLabel: string;
};

export function AccessibilityPanel({
  open,
  onClose,
  title,
  largeTextLabel,
  highContrastLabel,
  reduceMotionLabel,
  resetLabel,
}: AccessibilityPanelProps) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const initial = readSettings();
    setSettings(initial);
    applySettings(initial);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function update(partial: Partial<A11ySettings>) {
    setSettings((current) => {
      const next = { ...current, ...partial };
      applySettings(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (!open) return null;

  const toggles: Array<{ key: keyof A11ySettings; label: string }> = [
    { key: "largeText", label: largeTextLabel },
    { key: "highContrast", label: highContrastLabel },
    { key: "reduceMotion", label: reduceMotionLabel },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close accessibility"
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-paper text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:bg-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-5">
          {toggles.map((toggle) => (
            <label
              key={toggle.key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
            >
              <span className="text-sm font-semibold">{toggle.label}</span>
              <input
                type="checkbox"
                checked={settings[toggle.key]}
                onChange={(event) => update({ [toggle.key]: event.target.checked })}
                className="h-4 w-4 accent-ink"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full rounded-full border border-line px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted transition hover:text-ink"
          >
            {resetLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}
