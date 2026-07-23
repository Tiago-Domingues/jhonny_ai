import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview access",
  robots: { index: false, follow: false },
};

export default function PreviewAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
