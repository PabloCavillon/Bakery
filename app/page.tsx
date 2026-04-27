import { getProducts, getPromos } from './lib/data'
import ParallaxWatermark from './components/ParallaxWatermark'
import Reveal from './components/Reveal'
import AdminTap from './components/AdminTap'
import CartSection from './components/CartSection'
import ProductGrid from './components/ProductGrid'
import FloatingCart from './components/FloatingCart'
import { CartProvider } from './components/CartContext'

const tickerItems = [
  "ARTESANAL", "//", "COOKIES", "//", "TORTAS", "//", "TARTAS", "//",
  "HECHO A MANO", "//", "CÓRDOBA", "//",
  "TARTAS Y TORTAS", "//", "PEDIDOS PERSONALIZADOS", "//"
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: 'Hermanas Baking',
  description: 'Cookies artesanales por encargo en Córdoba, Argentina. Tartas y tortas personalizadas hechas a mano con ingredientes reales.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pazbakery.vercel.app',
  telephone: '+5492974749605',
  priceRange: '$$',
  servesCuisine: ['Cookies', 'Tartas', 'Tortas', 'Repostería artesanal'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Córdoba',
    addressRegion: 'Córdoba',
    addressCountry: 'AR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -31.4135,
    longitude: -64.1811,
  },
  sameAs: ['https://www.instagram.com/pazz.cavillon/'],
  hasMenu: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pazbakery.vercel.app'}/catalogo`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+5492974749605',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
}

export default async function Home() {
  const [allProducts, promos] = await Promise.all([getProducts(), getPromos()])
  const products = allProducts.filter((p) => p.active)
  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 bg-(--nav-bg) border-b border-accent/15">
        {/* fila superior: logo + botón */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <span className="font-display text-lg sm:text-xl tracking-wide sm:tracking-widest text-(--nav-text) whitespace-nowrap">
            Hermanas Baking
          </span>
          <div className="hidden md:flex gap-8 text-sm tracking-wide text-muted/70">
            <a href="#cookies" className="hover:text-accent transition-colors">Cookies</a>
            <a href="#nosotras" className="hover:text-accent transition-colors">Nosotras</a>
            <a href="#pedidos" className="hover:text-accent transition-colors">Pedidos</a>
          </div>
          <a
            href="#pedidos"
            className="text-xs text-(--btn-bg) border border-dashed border-(--btn-bg)/50 px-3 sm:px-4 py-1.5 tracking-widest uppercase hover:bg-(--btn-bg) hover:text-(--btn-text) transition-colors whitespace-nowrap"
          >
            <span className="text-rose">→</span> pedir
          </a>
        </div>
        {/* fila inferior: links — solo mobile */}
        <div className="md:hidden flex border-t border-dashed border-accent/10">
          {[['#cookies', 'cookies'], ['#nosotras', 'nosotras'], ['#pedidos', 'pedidos']].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex-1 text-center text-xs tracking-[0.2em] uppercase text-muted/60 py-2.5 hover:text-accent hover:bg-accent/5 transition-colors border-b-2 border-transparent"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="min-h-screen flex flex-col justify-end bg-background pt-24 sm:pt-16 pb-12 sm:pb-16 relative overflow-hidden">

        <ParallaxWatermark />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full relative z-10">
          {/* headline */}
          <h1 className="font-display leading-none text-foreground mb-2">
            <span className="block text-[18vw] sm:text-[14vw] md:text-[9rem] lg:text-[10rem]">HERMANAS</span>
            <span
              className="block text-[18vw] sm:text-[14vw] md:text-[9rem] lg:text-[10rem] text-accent"
              style={{ transform: "translateX(3vw)" }}
            >
              BAKING
            </span>
          </h1>

          {/* subline */}
          <p className="font-display text-base sm:text-[3vw] md:text-2xl text-muted tracking-widest mt-3 sm:mt-4 uppercase">
            cookies · tartas · tortas
          </p>

          {/* body + ctas */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-10 mt-8 sm:mt-12">
            <p className="text-foreground/40 text-sm leading-relaxed max-w-xs">
              Pastelería artesanal, con ingredientes reales.<br />
              Pedidos personalizados.
            </p>
            <div className="flex flex-row gap-4 sm:gap-6 items-center">
              <a
                href="#catalogo"
                className="bg-(--btn-bg) text-(--btn-text) px-6 sm:px-8 py-3 font-display text-lg sm:text-xl tracking-widest opacity-100 hover:opacity-85 transition-opacity"
              >
                ver catálogo <span className="text-rose">↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <div className="bg-accent py-3 overflow-hidden border-y border-accent-dim">
        <div className="animate-ticker flex whitespace-nowrap">
          {tickerContent.map((item, i) => (
            <span
              key={i}
              className={`font-display text-base sm:text-lg tracking-[0.2em] mx-4 sm:mx-5 select-none ${item === '//' ? 'text-rose' : 'text-background'}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <CartProvider>

      {/* ─── COOKIES ─── */}
      <section id="catalogo" className="py-14 sm:py-20 bg-background">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* header */}
          <div className="mb-8 sm:mb-10 border-b border-dashed border-accent/20 pb-5 sm:pb-6">
            <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-2"><span className="text-rose">//</span> las cookies</p>
            <h2 className="font-display text-5xl sm:text-6xl md:text-8xl text-foreground leading-none">
              CATÁLOGO
            </h2>
          </div>

          {/* promos */}
          {promos.filter(p => p.active).map((promo, i) => (
            <div
              key={promo.id}
              className="mb-4 last:mb-10 sm:last:mb-12 border-2 border-dashed border-accent bg-accent/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ transform: `rotate(${i % 2 === 0 ? '-0.4' : '0.3'}deg)` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl select-none mt-0.5">{promo.emoji}</span>
                <div>
                  <p className="font-display text-2xl sm:text-3xl text-accent leading-none mb-1">
                    {promo.name}
                  </p>
                  <p className="text-foreground/60 text-xs leading-relaxed">{promo.desc}</p>
                </div>
              </div>
              <a
                href="#pedidos"
                className="text-[0.6rem] tracking-[0.3em] uppercase bg-rose text-background px-4 py-2 font-bold whitespace-nowrap hover:bg-rose/80 transition-colors shrink-0 self-start sm:self-auto"
              >
                ENCARGAR →
              </a>
            </div>
          ))}

          <ProductGrid products={products} />

          <p className="text-center text-rose/30 tracking-[0.4em] text-xs mt-12 sm:mt-14 select-none">
            * * * * * * * * * * * * * * * * *
          </p>
        </Reveal>
      </section>

      {/* ─── TAMBIÉN HACEMOS ─── */}
      <div className="bg-surface-alt border-y border-dashed border-accent/20">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-5 sm:mb-6"><span className="text-rose">//</span> también hacemos</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { e: "🎂", t: "TARTAS", d: "Artesanales, por encargo." },
              { e: "🎉", t: "TORTAS PERSONALIZADAS", d: "Para cumples, eventos y lo que se te ocurra." },
              { e: "📦", t: "CAJAS REGALO", d: "Mix de cookies para llevar o regalar." },
            ].map((item) => (
              <div
                key={item.t}
                className="flex items-start gap-3 sm:gap-4 p-4 border border-dashed border-accent/15 hover:border-accent/40 transition-colors"
              >
                <span className="text-2xl sm:text-3xl select-none shrink-0">{item.e}</span>
                <div>
                  <p className="font-display text-lg sm:text-xl text-foreground leading-none mb-1">{item.t}</p>
                  <p className="text-muted/70 text-xs">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ─── NOSOTRAS ─── */}
      <section id="nosotras" className="py-14 sm:py-20 bg-background">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 sm:gap-12 items-start">

            <div className="md:col-span-3">
              <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-5 sm:mb-6"><span className="text-rose">//</span> nosotras</p>
              <h2
                className="font-display text-4xl sm:text-5xl md:text-7xl text-foreground leading-none mb-8 sm:mb-10"
                style={{ transform: "rotate(-0.5deg)" }}
              >
                  NOSOTRAS.
              </h2>
              <div className="space-y-4 text-foreground/50 text-sm leading-relaxed border-l-2 border-dashed border-accent/30 pl-5 sm:pl-6">
                <p>
                  Somos dos hermanas horneando cosas ricas desde casa. Este emprendimiento nace de nuestro
                  gusto por la pastelería y con el objetivo de poder viajar al exterior.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-3 md:grid-cols-1 gap-4 sm:gap-6 md:pt-24">
              {[
                ["100%", "hecho a mano"]
              ].map(([num, label], i) => (
                <div
                  key={label}
                  className="border border-dashed border-accent/25 p-4 sm:p-5"
                  style={{ transform: `rotate(${i % 2 === 0 ? "-0.6" : "0.6"}deg)` }}
                >
                  <p className="font-display text-3xl sm:text-5xl text-accent leading-none">{num}</p>
                  <p className="text-muted/60 text-[0.6rem] sm:text-xs tracking-widest uppercase mt-1 sm:mt-2">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </Reveal>
      </section>

      {/* ─── PEDIDOS ─── */}
      <section id="pedidos" className="py-16 sm:py-24 bg-accent relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[50vw] leading-none opacity-5" style={{ transform: "rotate(10deg)" }}>🍪</span>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="mb-10 sm:mb-12">
            <p className="text-background/50 text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-3 sm:mb-4">
              <span className="text-rose/70">//</span> encargá
            </p>
            <h2 className="font-display text-[13vw] sm:text-[10vw] md:text-7xl text-background leading-none mb-4">
              ¡ENCARGÁ<br />LAS TUYAS!
            </h2>
            <p className="text-background/60 text-sm max-w-sm">
              Elegí tus productos, completá los datos y enviá el pedido por WhatsApp.
            </p>
          </div>

          <CartSection products={products} promos={promos} />

          {/* Secondary */}
          <div className="mt-10 sm:mt-12 text-center border-t border-dashed border-background/20 pt-6">
            <p className="text-background/40 text-xs tracking-widest mb-4">también por instagram</p>
            <a
              href="https://instagram.com/pazz.cavillon"
              className="border border-dashed border-background/30 text-background/60 px-8 py-2.5 font-display text-sm tracking-widest hover:bg-background/10 transition-colors"
            >
              @pazz.cavillon
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-surface-alt border-t border-dashed border-accent/20 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left">
          <AdminTap className="font-display text-xl sm:text-2xl tracking-widest text-accent">
            Hermanas Baking
          </AdminTap>
          <p className="text-muted/50 text-[0.6rem] sm:text-xs tracking-widest uppercase">
            cookies artesanales · córdoba, argentina · 2026
          </p>
          <a
            href="https://instagram.com/pazz.cavillon"
            className="text-muted/60 text-xs tracking-widest hover:text-accent transition-colors"
          >
            @pazz.cavillon
          </a>
        </div>
      </footer>

      <FloatingCart products={products} promos={promos} />
      </CartProvider>

    </main>
  );
}
