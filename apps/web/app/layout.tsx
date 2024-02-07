import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.scss";
import classNames from "classnames";
import { Header } from "@/app/Header";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Let's Vote",
  description: "Demo of AI-powered voting interface",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={classNames(GeistSans.variable, playfair.variable)}>
        {/* header */}
        <Header />
        {children}
      </body>
    </html>
  );
}
