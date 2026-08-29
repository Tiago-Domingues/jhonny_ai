"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { storefrontCopy, storefrontText } from "@/lib/storefrontCopy";

type UiKey = keyof (typeof storefrontCopy)["en"]["ui"];

export function useUiText() {
  const { locale } = useLanguage();
  return storefrontText(locale).ui;
}

export function UiText({ k }: { k: UiKey }) {
  const ui = useUiText();
  return <>{ui[k]}</>;
}
