'use client'

import { useState, useTransition } from 'react'
import { useCart } from './CartContext'
import { addPublicOrder } from '../actions'
import { calcBreakdown } from '../lib/promo'
import type { Product, OrderItem, Promo } from '../lib/data'

const WA_PHONE = '5492974749605'

export default function CartSection({ products, promos }: { products: Product[]; promos: Promo[] }) {
  const { qtys, setQtys } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const items: OrderItem[] = products
    .filter((p) => (qtys[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, productName: p.name, qty: qtys[p.id], unitPrice: p.priceValue }))

  const { total, applications } = calcBreakdown(qtys, products, promos)

  const adjust = (id: string, delta: number) =>
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))

  const handleOrder = () => {
    if (!name.trim()) { setError('Ingresá tu nombre'); return }
    if (!phone.trim()) { setError('Ingresá tu WhatsApp'); return }
    if (items.length === 0) { setError('No tenés productos en el carrito'); return }
    setError('')

    // Build URL and open WhatsApp synchronously (within the user click gesture)
    // so browsers don't block it as a popup
    const lines = ['Hola! Quiero hacer un pedido:', '']
    for (const item of items) lines.push(`- ${item.qty}x ${item.productName}`)
    lines.push('', `Total: $${total.toLocaleString('es-AR')}`, `Nombre: ${name.trim()}`, `Telefono: ${phone.trim()}`)
    if (notes.trim()) lines.push(`Aclaracion: ${notes.trim()}`)
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')

    // Save to server after opening WhatsApp
    startTransition(async () => {
      await addPublicOrder({ customerName: name.trim(), phone: phone.trim(), items, notes: notes.trim(), total })
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4 select-none">🎉</p>
        <p className="font-display text-4xl text-background leading-none mb-3">¡YA CASI!</p>
        <p className="text-background/70 text-sm leading-relaxed max-w-xs mx-auto mb-8">
          Se abrió WhatsApp con el resumen del pedido. Revisalo y envialo cuando estés lista.
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setQtys({}); setName(''); setPhone(''); setNotes('') }}
          className="text-background/60 text-xs tracking-[0.3em] uppercase border border-dashed border-background/30 px-5 py-2.5 hover:bg-background/10 transition-colors"
        >
          hacer otro pedido
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-background/20 p-10 sm:p-14 text-center">
        <p className="text-5xl mb-4 select-none opacity-30">🍪</p>
        <p className="text-background/50 text-sm tracking-[0.2em] leading-relaxed">
          elegí tus cookies arriba<br />y volvé acá para confirmar el pedido
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Order summary */}
      <div className="border border-dashed border-background/30 bg-background/5 p-4 sm:p-5 mb-6">
        <p className="text-background/40 text-[0.6rem] tracking-[0.3em] uppercase mb-4">// tu pedido</p>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <span className="text-background/70 text-sm flex-1 min-w-0 truncate">{item.productName}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button" onClick={() => adjust(item.productId, -1)}
                  className="w-7 h-7 border border-dashed border-background/30 text-background flex items-center justify-center text-base leading-none hover:bg-background/15 transition-colors"
                >−</button>
                <span className="w-5 text-center font-display text-lg text-background leading-none select-none">{item.qty}</span>
                <button
                  type="button" onClick={() => adjust(item.productId, 1)}
                  className="w-7 h-7 border border-dashed border-background/30 text-background flex items-center justify-center text-base leading-none hover:bg-background/15 transition-colors"
                >+</button>
              </div>
              <span className="text-background/50 text-sm w-20 text-right tabular-nums shrink-0">
                ${(item.qty * item.unitPrice).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>
        {applications.length > 0 && (
          <div className="border-t border-dashed border-background/20 mt-4 pt-3 space-y-1.5">
            {applications.map((app, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-background/60 text-xs tracking-wide">
                  {app.promo.emoji} {app.promo.name}{app.times > 1 ? ` ×${app.times}` : ''}
                </span>
                <span className="text-background/70 text-sm tabular-nums">
                  −${app.savings.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-dashed border-background/20 mt-3 pt-4 flex items-center justify-between">
          <span className="text-background/40 text-[0.6rem] tracking-widest uppercase">total</span>
          <span className="font-display text-4xl sm:text-5xl text-background">${total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Customer fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          placeholder="Tu nombre *" value={name} onChange={(e) => setName(e.target.value)}
          className="bg-background/10 border border-dashed border-background/30 text-background text-sm px-3 py-3 focus:outline-none focus:border-background/60 placeholder:text-background/35 w-full"
        />
        <input
          placeholder="WhatsApp / teléfono *" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="bg-background/10 border border-dashed border-background/30 text-background text-sm px-3 py-3 focus:outline-none focus:border-background/60 placeholder:text-background/35 w-full"
        />
      </div>
      <textarea
        rows={2} placeholder="Notas — alergias, fecha de entrega, aclaraciones..."
        value={notes} onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-background/10 border border-dashed border-background/30 text-background text-sm px-3 py-3 focus:outline-none focus:border-background/60 resize-none mb-5 placeholder:text-background/35"
      />

      {error && <p className="text-yellow-200 text-xs mb-4">{error}</p>}

      <button
        type="button" onClick={handleOrder} disabled={isPending}
        className="w-full font-display text-xl sm:text-2xl tracking-widest py-4 hover:opacity-85 transition-opacity disabled:opacity-40"
        style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
      >
        {isPending ? 'UN SEGUNDO...' : 'CONFIRMAR POR WHATSAPP →'}
      </button>
      <p className="text-background/35 text-[0.6rem] tracking-[0.2em] text-center mt-3 uppercase">
        se abre whatsapp con el resumen · podés editar antes de enviar
      </p>
    </div>
  )
}
