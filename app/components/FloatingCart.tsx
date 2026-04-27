'use client'

import { useCart } from './CartContext'
import { calcTotal } from '../lib/promo'
import type { Product, Promo } from '../lib/data'

export default function FloatingCart({ products, promos }: { products: Product[]; promos: Promo[] }) {
  const { qtys } = useCart()
  const totalQty = Object.values(qtys).reduce((s, q) => s + q, 0)

  if (totalQty === 0) return null

  const total = calcTotal(qtys, products, promos)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="#pedidos"
        className="flex items-center gap-3 px-4 sm:px-5 py-3 shadow-2xl font-display tracking-widest hover:opacity-85 transition-opacity"
        style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
      >
        <span className="text-xl select-none">🛒</span>
        <div className="leading-none">
          <p className="text-base sm:text-lg">{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
          <p className="text-sm opacity-75 mt-0.5">${total.toLocaleString('es-AR')}</p>
        </div>
        <span className="opacity-60 text-sm ml-1">→</span>
      </a>
    </div>
  )
}
