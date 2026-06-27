"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (typeof translations)[Locale];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt");

  useEffect(() => {
    const stored = window.localStorage.getItem("jss-locale") as Locale | null;
    if (stored === "pt" || stored === "en") {
      setLocale(stored);
    } else if (navigator.language.toLowerCase().startsWith("en")) {
      setLocale("en");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("jss-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value: LanguageContextValue = {
    locale,
    setLocale,
    toggle: () => setLocale(locale === "pt" ? "en" : "pt"),
    t: translations[locale],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
