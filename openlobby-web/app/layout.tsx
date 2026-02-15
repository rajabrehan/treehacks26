import type { Metadata } from "next";
import { Fragment_Mono, Instrument_Serif, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "OpenLobby",
  description: "Corporate influence tracker. Search the money trail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${sourceSerif.variable} ${fragmentMono.variable}`}
    >
      <body
        className="min-h-dvh bg-background text-foreground antialiased selection:bg-[color:var(--blood)] selection:text-[color:var(--ink-900)]"
      >
        {children}
      </body>
    </html>
  );
}
