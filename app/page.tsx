import { getProducts } from './lib/data'
import ParallaxWatermark from './components/ParallaxWatermark'
import Reveal from './components/Reveal'
import AdminTap from './components/AdminTap'

const testimonials = [
  {
    text: "La COO-CHIPS es adictiva. La pedí una vez y ahora la encargo todas las semanas.",
    name: "Caro M.",
    location: "Córdoba Capital",
  },
  {
    text: "La COO-LEMON es otra cosa. El curd de limón con merengue es perfección.",
    name: "Nico T.",
    location: "Nueva Córdoba",
  },
  {
    text: "Pedí una torta personalizada para un cumple y quedaron todos locos. Cero dudas.",
    name: "Sol R.",
    location: "Cerro de las Rosas",
  },
];

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
  sameAs: ['https://www.instagram.com/la.cookeriacba/'],
  hasMenu: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pazbakery.vercel.app'}/catalogo`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+5492974749605',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
}

export default async function Home() {
  const allProducts = await getProducts()
  const products = allProducts.filter((p) => p.active)
  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 bg-background border-b border-accent/15">
        {/* fila superior: logo + botón */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <span className="font-display text-lg sm:text-xl tracking-wide sm:tracking-widest text-accent whitespace-nowrap">
            <span className="text-rose">*</span> Hermanas Baking
          </span>
          <div className="hidden md:flex gap-8 text-sm tracking-wide text-muted/70 lowercase">
            <a href="#cookies" className="hover:text-accent transition-colors">Cookies</a>
            <a href="#nosotros" className="hover:text-accent transition-colors">Nosotros</a>
            <a href="#pedidos" className="hover:text-accent transition-colors">Pedidos</a>
          </div>
          <a
            href="#pedidos"
            className="text-xs text-rose border border-dashed border-rose/50 px-3 sm:px-4 py-1.5 tracking-widest uppercase hover:bg-rose hover:text-background transition-colors whitespace-nowrap"
          >
            <span className="text-rose">→</span> pedir
          </a>
        </div>
        {/* fila inferior: links — solo mobile */}
        <div className="md:hidden flex border-t border-dashed border-accent/10">
          {[['#cookies', 'cookies'], ['#nosotros', 'nosotros'], ['#pedidos', 'pedidos']].map(([href, label]) => (
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
          {/* label */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <span className="w-6 sm:w-8 h-px bg-accent/40 shrink-0" />
            <p className="text-accent/60 text-[0.6rem] sm:text-xs tracking-[0.35em] uppercase">
              cba, argentina — est. 2026
            </p>
          </div>

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
              Hecho por encargo.
            </p>
            <div className="flex flex-row gap-4 sm:gap-6 items-center">
              <a
                href="#pedidos"
                className="bg-rose text-background px-6 sm:px-8 py-3 font-display text-lg sm:text-xl tracking-widest hover:bg-rose/80 transition-colors"
              >
                PEDIR
              </a>
              <a
                href="#cookies"
                className="text-foreground/50 text-xs tracking-[0.3em] uppercase hover:text-accent transition-colors"
              >
                ver cookies <span className="text-rose">↓</span>
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

      {/* ─── COOKIES ─── */}
      <section id="cookies" className="py-14 sm:py-20 bg-background">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* header */}
          <div className="mb-8 sm:mb-10 border-b border-dashed border-accent/20 pb-5 sm:pb-6">
            <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-2"><span className="text-rose">//</span> las cookies</p>
            <h2 className="font-display text-5xl sm:text-6xl md:text-8xl text-foreground leading-none">
              EL MENÚ.
            </h2>
          </div>

          {/* promo */}
          <div
            className="mb-10 sm:mb-12 border-2 border-dashed border-accent bg-accent/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ transform: "rotate(-0.4deg)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl select-none mt-0.5">🍪</span>
              <div>
                <p className="font-display text-2xl sm:text-3xl text-accent leading-none mb-1">
                  PROMO X4
                </p>
                <p className="text-foreground/60 text-xs leading-relaxed">
                  Llevate 4 cookies y pagás{" "}
                  <span className="text-foreground/30 line-through">$18.000</span>{" "}
                  <span className="text-accent font-bold">$16.000</span>
                  {" "}— ahorrás $2.000.
                </p>
              </div>
            </div>
            <a
              href="#pedidos"
              className="text-[0.6rem] tracking-[0.3em] uppercase bg-rose text-background px-4 py-2 font-bold whitespace-nowrap hover:bg-rose/80 transition-colors shrink-0 self-start sm:self-auto"
            >
              ENCARGAR →
            </a>
          </div>

          {/* grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {products.map((p) => (
              <a
                key={p.name}
                href="#pedidos"
                className={`block border border-dashed border-accent/30 p-5 sm:p-6 bg-surface/40 hover:bg-surface transition-colors duration-200 group ${p.rotate}`}
              >
                {/* image or emoji */}
                <div className="relative w-full aspect-video mb-4 overflow-hidden bg-surface-alt">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl sm:text-6xl select-none">{p.emoji}</span>
                    </div>
                  )}
                  <span
                    className="absolute top-2 right-2 text-[0.5rem] sm:text-[0.55rem] tracking-[0.2em] uppercase bg-rose text-background px-2 py-1 font-bold"
                    style={{ transform: "rotate(2deg)" }}
                  >
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-foreground leading-none mb-2 sm:mb-3 tracking-wide">
                  {p.name}
                </h3>
                <p className="text-muted/80 text-xs leading-relaxed">
                  {p.desc}
                </p>
                <div className="flex items-center justify-between mt-5 sm:mt-6 pt-4 border-t border-dashed border-accent/15">
                  <span className="font-display text-2xl sm:text-3xl text-accent leading-none">
                    {p.price}
                  </span>
                  <span className="text-[0.6rem] text-foreground/20 tracking-[0.2em] uppercase group-hover:text-foreground/60 transition-colors">
                    encargar <span className="text-rose/40 group-hover:text-rose transition-colors">→</span>
                  </span>
                </div>
              </a>
            ))}
          </div>

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

      {/* ─── NOSOTROS ─── */}
      <section id="nosotros" className="py-14 sm:py-20 bg-background">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 sm:gap-12 items-start">

            <div className="md:col-span-3">
              <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-5 sm:mb-6"><span className="text-rose">//</span> nosotros</p>
              <h2
                className="font-display text-4xl sm:text-5xl md:text-7xl text-foreground leading-none mb-8 sm:mb-10"
                style={{ transform: "rotate(-0.5deg)" }}
              >
                NACIÓ EN<br />UNA COCINA<br />CHICA.
              </h2>
              <div className="space-y-4 text-foreground/50 text-sm leading-relaxed border-l-2 border-dashed border-accent/30 pl-5 sm:pl-6">
                <p>
                  No empezamos en ninguna escuela de gastronomía. Empezamos en
                  casa, a las 5am, con el horno encendido y los vecinos preguntando
                  de dónde venía ese olor.
                </p>
                <p>
                  Hermanas Baking es pastelería sin pretensiones. Ingredientes reales,
                  recetas que no mienten. No seguimos tendencias — hacemos lo que
                  creemos que tiene que saber bien.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-3 md:grid-cols-1 gap-4 sm:gap-6 md:pt-24">
              {[
                ["100%", "hecho a mano"],
                ["0", "conservantes"],
                ["∞", "amor por lo que hacemos"],
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

      {/* ─── TESTIMONIOS ─── */}
      <section className="py-12 sm:py-16 bg-surface border-y border-dashed border-accent/15">
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-muted text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-8 sm:mb-10"><span className="text-rose">//</span> la gente dice</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {testimonials.map((t, i) => (
              <div key={t.name} style={{ transform: `rotate(${["-0.5", "0.4", "-0.3"][i]}deg)` }}>
                <p className="text-foreground/80 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <span className="w-5 sm:w-6 h-px bg-rose/40 shrink-0" />
                  <div>
                    <p className="font-display text-base sm:text-lg text-foreground tracking-wide leading-none">
                      {t.name}
                    </p>
                    <p className="text-muted/50 text-[0.6rem] sm:text-xs tracking-widest uppercase">
                      {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── CTA ─── */}
      <section id="pedidos" className="py-16 sm:py-24 bg-accent relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span
            className="text-[50vw] leading-none opacity-5"
            style={{ transform: "rotate(10deg)" }}
          >
            🍪
          </span>
        </div>

        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <p className="text-background/50 text-4xl sm:text-5xl mb-2 select-none">⚠</p>
          <p className="text-background/50 text-[0.6rem] sm:text-xs tracking-[0.4em] uppercase mb-3 sm:mb-4"><span className="text-rose/70">//</span> aviso</p>

          <h2 className="font-display text-[13vw] sm:text-[10vw] md:text-7xl text-background leading-none mb-5 sm:mb-6">
            ¡ENCARGÁ<br />LAS TUYAS!
          </h2>

          <p className="text-background/60 text-sm leading-relaxed max-w-xs mx-auto mb-8 sm:mb-10">
            Cookies, tartas y tortas personalizadas. Pedí por WhatsApp o escribinos por Instagram.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <a
              href="https://wa.me/5492974749605?text=Hola!%20queria%20encargar%20"
              className="bg-background text-accent px-7 sm:px-9 py-3 font-display text-lg sm:text-xl tracking-widest hover:bg-background/90 transition-colors"
            >
              WHATSAPP
            </a>
            <a
              href="https://instagram.com/la.cookeriacba"
              className="border-2 border-background text-background px-7 sm:px-9 py-3 font-display text-lg sm:text-xl tracking-widest hover:bg-background hover:text-accent transition-colors"
            >
              INSTAGRAM
            </a>
          </div>

          <p className="text-background/40 text-[0.6rem] sm:text-xs tracking-[0.5em] uppercase">
            @la.cookeriacba
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-surface-alt border-t border-dashed border-accent/20 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left">
          <AdminTap className="font-display text-xl sm:text-2xl tracking-widest text-accent">
            <span className="text-rose">*</span> Hermanas Baking
          </AdminTap>
          <p className="text-muted/50 text-[0.6rem] sm:text-xs tracking-widest uppercase">
            cookies artesanales · córdoba, argentina · 2026
          </p>
          <a
            href="https://instagram.com/la.cookeriacba"
            className="text-muted/60 text-xs tracking-widest hover:text-accent transition-colors"
          >
            @la.cookeriacba
          </a>
        </div>
      </footer>

    </main>
  );
}
