'use client'

import { useState, useTransition } from 'react'
import { updatePromos } from '../../actions'
import type { Product, Promo, PromoConditionItem } from '../../lib/data'

export default function PromosTab({ initialPromos, products }: { initialPromos: Promo[]; products: Product[] }) {
  const [promos, setPromos] = useState<Promo[]>(initialPromos)
  const [isPending, startTransition] = useTransition()
  const [savedMsg, setSavedMsg] = useState('')

  const categories = [...new Set(
    products.map(p => (p.category ?? '').trim()).filter(Boolean)
  )].sort()

  const activeProducts = products.filter(p => p.active)

  const save = () => {
    startTransition(async () => {
      const res = await updatePromos(promos)
      if (res.ok) { setSavedMsg('✓ Guardado'); setTimeout(() => setSavedMsg(''), 2500) }
    })
  }

  const addPromo = () => {
    setPromos(prev => [...prev, {
      id: `promo-${Date.now()}`,
      name: 'NUEVA PROMO',
      desc: '',
      emoji: '🎉',
      conditions: [],
      bundlePrice: 0,
      active: true,
    }])
  }

  const set = (id: string, changes: Partial<Promo>) =>
    setPromos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))

  const del = (id: string) => {
    if (!confirm('¿Eliminar esta promo?')) return
    setPromos(prev => prev.filter(p => p.id !== id))
  }

  const addCond = (promoId: string) => {
    const cond: PromoConditionItem = { kind: 'category', id: '', qty: 1 }
    setPromos(prev => prev.map(p => p.id === promoId ? { ...p, conditions: [...p.conditions, cond] } : p))
  }

  const setCond = (promoId: string, idx: number, changes: Partial<PromoConditionItem>) => {
    setPromos(prev => prev.map(p => {
      if (p.id !== promoId) return p
      return { ...p, conditions: p.conditions.map((c, i) => i === idx ? { ...c, ...changes } : c) }
    }))
  }

  const removeCond = (promoId: string, idx: number) => {
    setPromos(prev => prev.map(p => {
      if (p.id !== promoId) return p
      return { ...p, conditions: p.conditions.filter((_, i) => i !== idx) }
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      {promos.length === 0 && (
        <p className="text-zinc-600 text-sm text-center py-12 tracking-widest">// sin promos configuradas</p>
      )}

      {promos.map(promo => (
        <div key={promo.id} className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <input
              className="w-10 bg-zinc-100 border border-dashed border-zinc-200 text-xl text-center focus:outline-none focus:border-zinc-500 py-1.5"
              value={promo.emoji}
              onChange={e => set(promo.id, { emoji: e.target.value })}
              title="Emoji"
            />
            <button
              type="button"
              onClick={() => set(promo.id, { active: !promo.active })}
              className={`w-10 h-5 rounded-full border border-dashed transition-colors flex items-center px-0.5 shrink-0 ${promo.active ? 'bg-white/10 border-zinc-900/20' : 'bg-zinc-100 border-zinc-200'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-transform ${promo.active ? 'bg-zinc-900 translate-x-5' : 'bg-zinc-300'}`} />
            </button>
            <span className="text-zinc-500 text-[0.6rem]">{promo.active ? 'visible' : 'oculta'}</span>
            <input
              className="flex-1 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-500"
              value={promo.name}
              onChange={e => set(promo.id, { name: e.target.value })}
              placeholder="Nombre (ej: PROMO X4)"
            />
          </div>

          <input
            className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 mb-3 placeholder:text-zinc-500"
            value={promo.desc}
            onChange={e => set(promo.id, { desc: e.target.value })}
            placeholder="Descripción visible en el catálogo (ej: 4 cookies por $16.000, ahorrás $2.000)"
          />

          <div className="mb-3">
            <p className="text-zinc-400 text-[0.6rem] tracking-widest uppercase mb-2">// condiciones para aplicar</p>
            <div className="flex flex-col gap-2">
              {promo.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  <select
                    value={cond.kind}
                    onChange={e => setCond(promo.id, idx, { kind: e.target.value as 'category' | 'product', id: '' })}
                    className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-xs px-2 py-2 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    <option value="category">categoría</option>
                    <option value="product">producto</option>
                  </select>

                  {cond.kind === 'category' ? (
                    <>
                      <input
                        list={`promo-catlist-${promo.id}-${idx}`}
                        className="flex-1 min-w-24 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-xs px-2 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500"
                        placeholder="Nombre de categoría"
                        value={cond.id}
                        onChange={e => setCond(promo.id, idx, { id: e.target.value })}
                      />
                      <datalist id={`promo-catlist-${promo.id}-${idx}`}>
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </>
                  ) : (
                    <select
                      value={cond.id}
                      onChange={e => setCond(promo.id, idx, { id: e.target.value })}
                      className="flex-1 min-w-24 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-xs px-2 py-2 focus:outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="">— elegir producto —</option>
                      {activeProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <label className="text-zinc-400 text-[0.6rem]">cant.</label>
                    <input
                      type="number"
                      min={1}
                      value={cond.qty}
                      onChange={e => setCond(promo.id, idx, { qty: Math.max(1, Number(e.target.value)) })}
                      className="w-14 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-center text-sm px-2 py-2 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCond(promo.id, idx)}
                    className="text-zinc-400 hover:text-red-400 transition-colors text-sm px-2 py-1 hover:bg-red-50 rounded shrink-0"
                  >✕</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addCond(promo.id)}
              className="mt-2 text-zinc-500 text-xs tracking-widest border border-dashed border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 transition-colors"
            >
              + agregar condición
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-dashed border-zinc-200">
            <div className="flex items-center gap-3">
              <label className="text-zinc-400 text-xs shrink-0">Precio del pack $</label>
              <input
                type="number"
                min={0}
                value={promo.bundlePrice}
                onChange={e => set(promo.id, { bundlePrice: Number(e.target.value) })}
                className="w-32 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg px-3 py-1.5 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="button"
              onClick={() => del(promo.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-3 py-1.5 rounded hover:bg-red-50 border border-dashed border-transparent hover:border-red-200 self-end sm:self-auto"
            >
              eliminar promo
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPromo}
        className="border border-dashed border-zinc-300 text-zinc-900 font-display text-base tracking-widest px-4 py-3 hover:bg-zinc-900/5 transition-colors flex items-center justify-center gap-2"
      >
        + NUEVA PROMO
      </button>

      <div className="flex items-center justify-end gap-4 pt-2 border-t border-dashed border-zinc-200">
        {savedMsg && <span className="text-green-400 text-xs">{savedMsg}</span>}
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="bg-zinc-900 text-white font-display text-base tracking-widest px-8 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {isPending ? 'GUARDANDO...' : 'GUARDAR PROMOS'}
        </button>
      </div>
    </div>
  )
}
