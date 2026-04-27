'use client'

import { useCart } from './CartContext'
import type { Product } from '../lib/data'

export default function ProductGrid({ products }: { products: Product[] }) {
  const { qtys, setQtys } = useCart()

  const adjust = (id: string, delta: number) =>
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))

  // Group by category, preserving insertion order; uncategorized goes last
  const groupOrder: string[] = []
  const grouped: Record<string, Product[]> = {}
  for (const p of products) {
    const key = (p.category ?? '').trim()
    if (!grouped[key]) { grouped[key] = []; groupOrder.push(key) }
    grouped[key].push(p)
  }
  const hasNamed = groupOrder.some(k => k !== '')
  if (hasNamed && grouped[''] !== undefined) {
    const i = groupOrder.indexOf('')
    if (i !== -1) { groupOrder.splice(i, 1); groupOrder.push('') }
  }

  return (
    <>
      {groupOrder.map((cat) => (
        <div key={cat || '__none__'} className={hasNamed ? 'mb-12 last:mb-0' : ''}>
          {cat && (
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <span className="text-rose text-xs">//</span>
              <h3 className="font-display text-3xl sm:text-4xl text-foreground leading-none tracking-wide uppercase">{cat}</h3>
              <div className="flex-1 border-t border-dashed border-accent/20" />
            </div>
          )}
          {!cat && hasNamed && (
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <div className="flex-1 border-t border-dashed border-accent/10" />
              <span className="font-display text-lg text-muted/40 leading-none tracking-widest uppercase">otros</span>
              <div className="flex-1 border-t border-dashed border-accent/10" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {grouped[cat].map((p) => {
              const qty = qtys[p.id] ?? 0
              return (
                <div
                  key={p.name}
                  className={`product-card border border-dashed p-5 sm:p-6 transition-all duration-300 ${qty > 0 ? '-translate-y-1 shadow-lg' : 'hover:-translate-y-1 hover:shadow-lg'}`}
                  style={{ backgroundColor: 'var(--card-bg)' }}
                >
                  {/* image or emoji */}
                  <div className="relative w-full aspect-video mb-4 overflow-hidden bg-surface-alt">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image} alt={p.name} className="w-full h-full object-cover"
                        style={{
                          objectPosition: p.imagePosition ?? 'center center',
                          transform: (p.imageZoom ?? 1) !== 1 ? `scale(${p.imageZoom})` : undefined,
                          transformOrigin: p.imagePosition ?? 'center center',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl sm:text-6xl select-none">{p.emoji}</span>
                      </div>
                    )}
                    <span
                      className="absolute top-2 right-2 text-[0.5rem] sm:text-[0.55rem] tracking-[0.2em] uppercase px-2 py-1 font-bold"
                      style={{ transform: 'rotate(2deg)', backgroundColor: 'var(--card-tag-bg)', color: 'var(--bg)' }}
                    >
                      {p.tag}
                    </span>
                    {/* qty badge */}
                    {qty > 0 && (
                      <div
                        className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center font-display text-base leading-none"
                        style={{ backgroundColor: 'var(--card-tag-bg)', color: 'var(--bg)' }}
                      >
                        {qty}
                      </div>
                    )}
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl leading-none mb-2 sm:mb-3 tracking-wide" style={{ color: 'var(--card-title)' }}>
                    {p.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--card-desc)' }}>
                    {p.desc}
                  </p>

                  {/* price + counter */}
                  <div className="flex items-center justify-between mt-5 sm:mt-6 pt-4 border-t border-dashed border-accent/15">
                    <span className="font-display text-2xl sm:text-3xl leading-none" style={{ color: 'var(--card-price)' }}>
                      {p.price}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjust(p.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 border border-dashed flex items-center justify-center text-xl leading-none transition-opacity disabled:opacity-20 hover:opacity-60"
                        style={{ borderColor: 'color-mix(in srgb, var(--card-border) 50%, transparent)', color: 'var(--card-title)' }}
                      >−</button>
                      <span className="w-6 text-center font-display text-xl leading-none select-none" style={{ color: 'var(--card-title)' }}>
                        {qty || '·'}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjust(p.id, 1)}
                        className="w-8 h-8 border border-dashed flex items-center justify-center text-xl leading-none hover:opacity-60 transition-opacity"
                        style={{ borderColor: 'color-mix(in srgb, var(--card-border) 50%, transparent)', color: 'var(--card-title)' }}
                      >+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
