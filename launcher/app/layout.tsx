import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bug Busters — KEA × AURA Learn",
  description:
    "Bug Busters hackathon launcher. Two adaptive-learning experiences. One vision. Choose between KEA (structured adaptive learning) and AURA Learn (interactive learning experience).",
  keywords: ["adaptive learning", "KEA", "AURA Learn", "Bug Busters", "hackathon", "education"],
  authors: [{ name: "Bug Busters" }],
  openGraph: {
    title: "Bug Busters — KEA × AURA Learn",
    description: "Two adaptive-learning experiences. One vision.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
