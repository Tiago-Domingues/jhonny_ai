import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
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
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
