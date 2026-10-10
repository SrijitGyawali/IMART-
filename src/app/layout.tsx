import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "iMart — iPhone & Accessories, Butwal",
    template: "%s | iMart",
  },
  description:
    "iMart in Amarpath, Butwal: genuine iPhones, Mac, accessories and repairs. Home delivery in Butwal or pickup from our store.",
  metadataBase: new URL("https://imart.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
