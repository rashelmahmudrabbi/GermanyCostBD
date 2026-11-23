import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GermanyCostBD — Study in Germany Cost Planner & Preparation Tracker",
  description:
    "A personal study-abroad cost planner and preparation tracker for Bangladeshi students heading to Germany. Live EUR/BDT rates, blocked account (€11,904), non-recoverable vs retained funds breakdown, and visa checklist.",
  keywords: [
    "Germany study cost",
    "Bangladesh to Germany",
    "Blocked account Bangladesh",
    "Uni Assist fee BD",
    "German student visa cost",
    "জার্মানি পড়াশোনা খরচ",
    "ব্লকড একাউন্ট",
    "জার্মানি স্টুডেন্ট ভিসা",
  ],
  authors: [{ name: "GermanyCostBD" }],
  metadataBase: new URL("https://germanycostbd.vercel.app"),
  openGraph: {
    title: "GermanyCostBD — Study in Germany Cost Planner & Tracker",
    description:
      "A personal study-abroad cost planner and preparation tracker for Bangladeshi students heading to Germany. Live exchange rates, blocked account calculation, visa checklist, and budget comparison.",
    url: "https://germanycostbd.vercel.app",
    siteName: "GermanyCostBD",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GermanyCostBD — Study in Germany Cost Planner",
    description:
      "Plan your higher education costs from Bangladesh to Germany. Accurate breakdown of non-recoverable costs vs blocked account funds.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GermanyCostBD",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  description:
    "A personal study-abroad cost planner and preparation tracker for Bangladeshi students heading to Germany.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${hindSiliguri.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-200">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
