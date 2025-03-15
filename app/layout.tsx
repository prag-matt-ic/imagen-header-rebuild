import "./globals.css";

import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";

const sans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imagen Images by Pragmattic",
  description:
    "A recreation of the DeepMind Imagen 3 header video in code using React Three Fiber and WebGPU.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} antialiased`}>{children}</body>
    </html>
  );
}
