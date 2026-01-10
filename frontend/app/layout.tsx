import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "../components/Sidebar";
import SurveyBanner from "../components/SurveyBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Tailor AI",
  description: "Track applications and tailor resumes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden`}>
        <div className="flex h-full bg-slate-50">
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto w-full">
            {children}
          </main>
          <SurveyBanner />
        </div>
      </body>
    </html>
  );
}
