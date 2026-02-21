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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://isuiteassistant.com'),
  openGraph: {
    title: "iSuite — Intelligent Desktop Companion",
    description: "Transform your workflow with local AI, 100+ integrations, and powerful automation.",
    url: "/",
    siteName: "iSuite",
    images: [
      {
        url: "/og-image.jpg", // Placeholder for actual brand image
        width: 1200,
        height: 630,
        alt: "iSuite Desktop Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iSuite — Intelligent Desktop Companion",
    description: "Your fully integrated desktop neural layer.",
    creator: "@isuiteassistant",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents input zoom on mobile browsers for better app feel
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
