import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNavbar } from "@/components/app-navbar";
import { FeedbackWidget } from "@/components/feedback-widget";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "PumpIQ",
  description: "Predict Pump.fun Graduations Before They Happen",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <AppNavbar />
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-3 py-4 pb-28 sm:px-6 sm:py-8 sm:pb-10">
          {children}
        </main>
        <MobileBottomNav />
        <FeedbackWidget />
      </body>
    </html>
  );
}
