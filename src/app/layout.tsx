import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AtmosphereProvider } from "@/components/AtmosphereProvider";
import SkyRenderer from "@/components/weather-fx/SkyRenderer";
import ParticleEngine from "@/components/weather-fx/ParticleEngine";
import LightningOverlay from "@/components/weather-fx/LightningOverlay";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AeroCast - Weather Intelligence Platform",
  description:
    "Real-time weather, hyper-local forecasting, interactive radar maps, and AI-powered travel planning.",
  icons: "/favicon.svg",
  openGraph: {
    title: "AeroCast - Weather Intelligence",
    description:
      "AI-powered weather intelligence with real-time data, radar maps, and smart travel planning.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AtmosphereProvider>
          <SkyRenderer />
          <ParticleEngine />
          <LightningOverlay />
          <Navbar />
          <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-3 md:p-5 lg:p-6">
            {children}
          </main>
          <Footer />
        </AtmosphereProvider>
      </body>
    </html>
  );
}
