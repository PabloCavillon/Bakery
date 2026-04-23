import type { Metadata } from "next";
import { Luckiest_Guy, Nunito } from "next/font/google";
import "./globals.css";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  variable: "--font-luckiest",
  weight: "400",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'PAZ BAKERY',
    template: '%s | PAZ BAKERY',
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
    'paz bakery',
    'cookies a domicilio córdoba',
  ],

  authors: [{ name: 'PAZ BAKERY', url: BASE_URL }],
  creator: 'PAZ BAKERY',
  publisher: 'PAZ BAKERY',

  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: BASE_URL,
    siteName: 'PAZ BAKERY',
    title: 'PAZ BAKERY — Cookies artesanales por encargo · Córdoba',
    description:
      'Cookies artesanales por encargo en Córdoba, Argentina. Tartas y tortas personalizadas hechas a mano.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PAZ BAKERY — Cookies artesanales por encargo en Córdoba',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PAZ BAKERY — Cookies artesanales por encargo · Córdoba',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${luckiestGuy.variable} ${nunito.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
