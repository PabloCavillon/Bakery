import type { Metadata } from "next";
import {
  Luckiest_Guy, Bebas_Neue, Righteous, Paytone_One, Fredoka,
  Nunito, Inter, DM_Sans, Outfit,
} from "next/font/google";
import "./globals.css";
import { getSiteColors, getSiteFonts } from "./lib/data";

const luckiestGuy = Luckiest_Guy({ subsets: ["latin"], variable: "--font-luckiest", weight: "400" });
const bebasNeue   = Bebas_Neue({   subsets: ["latin"], variable: "--font-bebas",    weight: "400" });
const righteous   = Righteous({    subsets: ["latin"], variable: "--font-righteous", weight: "400" });
const paytoneOne  = Paytone_One({  subsets: ["latin"], variable: "--font-paytone",  weight: "400" });
const fredoka     = Fredoka({      subsets: ["latin"], variable: "--font-fredoka",  weight: ["400", "500", "600", "700"] });
const nunito      = Nunito({       subsets: ["latin"], variable: "--font-nunito",   weight: ["300", "400", "500", "600", "700", "800", "900"] });
const inter       = Inter({        subsets: ["latin"], variable: "--font-inter",    weight: ["300", "400", "500", "600", "700"] });
const dmSans      = DM_Sans({      subsets: ["latin"], variable: "--font-dm-sans",  weight: ["300", "400", "500", "600", "700"] });
const outfit      = Outfit({       subsets: ["latin"], variable: "--font-outfit",   weight: ["300", "400", "500", "600", "700"] });

const DISPLAY_VAR: Record<string, string> = {
  'luckiest-guy': '--font-luckiest',
  'bebas-neue':   '--font-bebas',
  'righteous':    '--font-righteous',
  'paytone-one':  '--font-paytone',
  'fredoka':      '--font-fredoka',
}
const BODY_VAR: Record<string, string> = {
  'nunito':   '--font-nunito',
  'inter':    '--font-inter',
  'dm-sans':  '--font-dm-sans',
  'outfit':   '--font-outfit',
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'LAS TROLAS BAKERY',
    template: '%s | LAS TROLAS BAKERY',
  },

  description:
    'Cookies artesanales por encargo en Córdoba, Argentina. Tartas y tortas personalizadas hechas a mano con ingredientes reales. Pedí por WhatsApp.',

  keywords: [
    'cookies artesanales córdoba',
    'cookies por encargo córdoba',
    'pastelería artesanal córdoba',
    'repostería por encargo córdoba',
    'tortas personalizadas córdoba',
    'tartas artesanales córdoba',
    'cookies córdoba argentina',
    'pastelería urbana córdoba',
    'LAS TROLAS BAKERY',
    'cookies a domicilio córdoba',
  ],

  authors: [{ name: 'LAS TROLAS BAKERY', url: BASE_URL }],
  creator: 'LAS TROLAS BAKERY',
  publisher: 'LAS TROLAS BAKERY',

  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: BASE_URL,
    siteName: 'LAS TROLAS BAKERY',
    title: 'LAS TROLAS BAKERY — Cookies artesanales por encargo · Córdoba',
    description:
      'Cookies artesanales por encargo en Córdoba, Argentina. Tartas y tortas personalizadas hechas a mano.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LAS TROLAS BAKERY — Cookies artesanales por encargo en Córdoba',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LAS TROLAS BAKERY — Cookies artesanales por encargo · Córdoba',
    description:
      'Cookies artesanales por encargo en Córdoba, Argentina. Tartas y tortas personalizadas.',
    images: ['/opengraph-image'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [c, f] = await Promise.all([getSiteColors(), getSiteFonts()])
  const displayVar = DISPLAY_VAR[f.display] ?? '--font-luckiest'
  const sansVar    = BODY_VAR[f.sans]       ?? '--font-nunito'
  const cssVars = `:root{--bg:${c.bg};--surface:${c.surface};--surface-alt:${c.surfaceAlt};--accent:${c.accent};--fg:${c.fg};--muted:${c.muted};--rose:${c.rose};--font-display:var(${displayVar}),cursive;--font-sans:var(${sansVar}),sans-serif;}`

  const fontClasses = [
    luckiestGuy.variable, bebasNeue.variable, righteous.variable,
    paytoneOne.variable, fredoka.variable, nunito.variable,
    inter.variable, dmSans.variable, outfit.variable,
  ].join(' ')

  return (
    <html lang="es" className={`${fontClasses} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {children}
      </body>
    </html>
  );
}
