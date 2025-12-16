import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

const monaSans = Mona_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepWise",
  description: "AI Interview Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={monaSans.className}>{children}</body>
    </html>
  );
}
