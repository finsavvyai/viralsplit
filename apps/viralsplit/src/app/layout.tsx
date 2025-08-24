import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViralSplit - Multi-Platform Video Optimization",
  description: "Transform your videos for TikTok, Instagram Reels, YouTube Shorts, and more with one upload. Professional video optimization for viral content.",
  keywords: "video optimization, TikTok, Instagram, YouTube, social media, content creation",
  authors: [{ name: "ViralSplit Team" }],
  openGraph: {
    title: "ViralSplit - Multi-Platform Video Optimization",
    description: "Transform your videos for TikTok, Instagram Reels, YouTube Shorts, and more with one upload.",
    url: "https://viralsplit.io",
    siteName: "ViralSplit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViralSplit - Multi-Platform Video Optimization",
    description: "Transform your videos for TikTok, Instagram Reels, YouTube Shorts, and more with one upload.",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
