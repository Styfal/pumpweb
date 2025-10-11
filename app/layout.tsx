import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEXPage - Instant Token Page Creator",
  description: "Create a token page in 10 seconds for pump.fun, four.meme, and coins traded on DEXs across Solana, Ethereum, BSC & more. Fast, easy, and ready to share",
  icons: {
    icon: '/powerfulstudios.jpg',
    shortcut: '/powerfulstudios.jpg',
    apple: '/powerfulstudios.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>{children}
          <Analytics />
        </main>
        <Footer />
      </body>
    </html>
  );
}
