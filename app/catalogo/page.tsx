import { getProducts } from '../lib/data'

export const metadata = {
  title: 'Menú de Cookies',
  description: 'Catálogo de cookies artesanales de Hermanas Baking. COO-CHIPS, COO-FRAMBUESA, COO-VELVET, COO-CARROT, COO-CACAO y COO-LEMON. Pedí por WhatsApp en Córdoba, Argentina.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pazbakery.vercel.app'}/catalogo`,
  },
  openGraph: {
    title: 'Menú de Cookies — Hermanas Baking',
    description: 'Cookies artesanales por encargo en Córdoba. 6 sabores únicos hechos a mano.',
    type: 'website',
  },
}

export default async function CatalogoPage() {
  const products = await getProducts()
  const active = products.filter((p) => p.active)

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">

      {/* ── HEADER ── */}
      <header className="bg-surface-alt border-b-4 border-accent px-4 py-8 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span className="font-display text-[30vw] leading-none text-accent/5" style={{ transform: 'rotate(-8deg)' }}>
            🍪
          </span>
        </div>
        <div className="relative z-10">
          <p className="text-accent/60 text-[0.6rem] tracking-[0.5em] uppercase mb-2">
            // est. 2024 · córdoba, argentina
          </p>
          <h1 className="font-display text-[20vw] sm:text-8xl md:text-9xl text-accent leading-none">
            Hermanas Baking
          </h1>
          <p className="font-display text-[4vw] sm:text-2xl text-muted tracking-[0.3em] uppercase mt-1">
            cookies por encargo
          </p>
        </div>
      </header>

      {/* ── PROMO BANNER ── */}
      <div className="bg-accent px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="font-display text-xl sm:text-2xl text-background tracking-widest">
          🍪 PROMO X4
        </span>
        <span className="text-background/70 text-xs sm:text-sm">
          4 cookies por{' '}
          <span className="line-through text-background/40">$18.000</span>{' '}
          <strong className="text-background">$16.000</strong>
          {' '}· ahorrás $2.000
        </span>
      </div>

      {/* ── PRODUCTS GRID ── */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {active.map((p, i) => (
            <div
              key={p.id}
              className="border border-dashed border-accent/30 bg-surface/50 p-4"
              style={{ transform: `rotate(${['-0.6','0.5','-0.4','0.7','-0.5','0.4'][i % 6]}deg)` }}
            >
              {/* image or emoji */}
              <div className="relative w-full aspect-square mb-3 overflow-hidden bg-surface">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl select-none">{p.emoji}</span>
                  </div>
                )}
                <span
                  className="absolute top-1.5 right-1.5 text-[0.45rem] tracking-[0.2em] uppercase bg-accent text-background px-1.5 py-0.5 font-bold leading-none"
                  style={{ transform: 'rotate(2deg)' }}
                >
                  {p.tag}
                </span>
              </div>
              <h3 className="font-display text-xl text-foreground leading-none mb-2 tracking-wide">
                {p.name}
              </h3>
              <p className="text-muted/80 text-[0.65rem] leading-relaxed mb-4">
                {p.desc}
              </p>
              <p className="font-display text-2xl text-accent leading-none">{p.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TAMBIÉN HACEMOS ── */}
      <section className="max-w-3xl mx-auto px-4 pb-8">
        <div className="border-t border-dashed border-accent/20 pt-8">
          <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-4">// también hacemos</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { e: '🎂', t: 'TARTAS' },
              { e: '🎉', t: 'TORTAS PERSONALIZADAS' },
              { e: '📦', t: 'CAJAS REGALO' },
            ].map((item) => (
              <div key={item.t} className="border border-dashed border-accent/20 p-3 text-center">
                <p className="text-2xl mb-1 select-none">{item.e}</p>
                <p className="font-display text-sm text-foreground leading-none tracking-wide">{item.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER / CONTACTO ── */}
      <footer className="bg-accent px-4 py-8 text-center">
        <p className="font-display text-4xl sm:text-5xl text-background tracking-widest leading-none mb-3">
          ¡ENCARGÁ LAS TUYAS!
        </p>
        <p className="text-background/60 text-sm mb-6">
          Por WhatsApp o Instagram · Envíos y retiro en Córdoba
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            href="https://wa.me/5491100000000"
            className="bg-background text-accent px-8 py-3 font-display text-xl tracking-widest hover:bg-background/90 transition-colors"
          >
            WHATSAPP
          </a>
          <a
            href="https://instagram.com/la.cookeriacba"
            className="border-2 border-background text-background px-8 py-3 font-display text-xl tracking-widest hover:bg-background hover:text-accent transition-colors"
          >
            @la.cookeriacba
          </a>
        </div>
      </footer>

    </main>
  )
}
