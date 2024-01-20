import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import classNames from "classnames";
import { Header } from "@/components/organisms/Header";

export const metadata: Metadata = {
  title: "Let's Vote",
  description: "Demo of AI-powered voting interface",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={classNames(inter.className, playfair.className)}>
        {/* header */}
        <Header />
        {children}
      </body>
    </html>
  );
}
