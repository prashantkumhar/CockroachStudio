import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Memeroach — The meme maker that doesn't suck",
  description: "Upload a photo, get 6 AI-generated meme ideas, edit, and share. Like a cockroach, a good meme survives everything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-surface text-on-surface font-body antialiased">
        {children}
      </body>
    </html>
  );
}
