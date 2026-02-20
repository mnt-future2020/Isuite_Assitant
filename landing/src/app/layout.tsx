import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google"; // New Fonts
import "./globals.css";

// Configure Fonts
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display", // For headings
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono", // For code, tech accents
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body", // For readable body text
  display: "swap",
});

export const metadata: Metadata = {
  title: "iSuite — Intelligent Desktop Companion",
  description: "Transform your workflow with local AI, 100+ integrations, and powerful automation. Secure, private, and always available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} antialiased bg-black text-white selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
