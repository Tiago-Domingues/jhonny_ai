import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Montserrat, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { FirstPurchaseOffer } from "@/components/FirstPurchaseOffer";
import {
  SITE_PREVIEW_COOKIE,
  isValidPreviewCookie,
  shouldEnforceComingSoon,
} from "@/lib/ecommerce/siteAccess";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-chinese",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jhonnysurfstore.pt"),
  title: {
    default: "Jhonny Surf Store — Surf Shop in Carcavelos, Lisboa",
    template: "%s | Jhonny Surf Store",
  },
  description:
    "Jhonny Surf Store — a community surf shop in Parede / Carcavelos, Lisboa. Surfboards, wetsuits, bodyboard, surfskate, clothing, repairs, board buy-back and expert advice. Where surfers become legends.",
  keywords: [
    "surf shop Carcavelos",
    "loja de surf Lisboa",
    "Jhonny Surf Store",
    "pranchas de surf",
    "wetsuits",
    "surfskate",
    "Parede",
  ],
  openGraph: {
    title: "Jhonny Surf Store — Surf Shop in Carcavelos, Lisboa",
    description:
      "Community surf shop in Parede / Carcavelos. Surfboards, wetsuits, surfskate, repairs, buy-back and expert advice.",
    url: "https://www.jhonnysurfstore.pt",
    siteName: "Jhonny Surf Store",
    locale: "en_US",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const previewUnlocked = isValidPreviewCookie(
    cookieStore.get(SITE_PREVIEW_COOKIE)?.value
  );
  // Pre-launch gate: hide store chrome so .com and .pt always match
  // (consent cookies are per-domain and otherwise make one look "bigger").
  const publicComingSoon = shouldEnforceComingSoon() && !previewUnlocked;
  const showCookieBanner =
    !publicComingSoon && !cookieStore.get("jss_consent")?.value;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${montserrat.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col text-ink ${
          publicComingSoon ? "bg-cream" : "bg-paper"
        }`}
      >
        {publicComingSoon ? (
          children
        ) : (
          <LanguageProvider>
            {children}
            <CookieConsent initialVisible={showCookieBanner} />
            <FirstPurchaseOffer />
          </LanguageProvider>
        )}
      </body>
    </html>
  );
}
