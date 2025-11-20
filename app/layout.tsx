import type { Metadata } from "next";
import { Poppins, Molle } from "next/font/google";
import "./globals.css";

const body_font = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
});

const display_font = Molle({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Sosie",
  description: "Next gen e-commerce clothing store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body_font.variable} ${display_font.variable}`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
