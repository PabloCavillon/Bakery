'use client'

import { useState, useTransition } from 'react'
import { addOrder, updateOrder, updateOrderStatus, deleteOrder } from '../../actions'
import type { Product, Order, OrderItem, Promo } from '../../lib/data'
import { calcTotal } from '../../lib/promo'
import { STATUS_COLORS, STATUS_OPTIONS } from '../constants'

// ─── New Order Form ───────────────────────────────────────────────────────────
function NewOrderForm({ products, promos, onCreated }: { products: Product[]; promos: Promo[]; onCreated: (o: Order) => void }) {
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [qtys, setQtys]   = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const active = products.filter((p) => p.active)

  const items: OrderItem[] = active
    .filter((p) => (qtys[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, productName: p.name, qty: qtys[p.id], unitPrice: p.priceValue }))

  const total        = calcTotal(qtys, active, promos)
  const unitTotal    = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const promoApplied = total < unitTotal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || items.length === 0) {
      setError('Completá nombre, teléfono y al menos una cookie')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await addOrder({ customerName: name, phone, items, notes, total })
      if (!res.ok) { setError(res.error ?? 'Error'); return }
      onCreated({ id: res.id!, createdAt: new Date().toISOString(), customerName: name, phone, items, notes, total, status: 'pendiente' })
      setName(''); setPhone(''); setNotes(''); setQtys({})
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5 mb-6">
      <p className="text-zinc-400 text-[0.6rem] tracking-[0.3em] uppercase mb-4">// nuevo pedido</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          placeholder="Nombre del cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 w-full"
        />
        <input
          placeholder="Teléfono / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 w-full"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {active.map((p) => (
          <div key={p.id} className="flex items-center gap-2 border border-dashed border-zinc-200 bg-zinc-100 px-2 sm:px-3 py-2">
            <span className="text-base sm:text-lg select-none shrink-0">{p.emoji}</span>
            <span className="text-xs text-zinc-400 flex-1 truncate">{p.name}</span>
            <input
              type="number" min={0} max={99}
              value={qtys[p.id] ?? 0}
              onChange={(e) => setQtys((q) => ({ ...q, [p.id]: Math.max(0, Number(e.target.value)) }))}
              className="w-10 sm:w-12 bg-zinc-100/30 border border-dashed border-zinc-200 text-zinc-900 text-center text-sm px-1 py-1 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <textarea
        rows={2} placeholder="Notas (dirección, aclaraciones, etc.)"
        value={notes} onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none mb-4 placeholder:text-zinc-600"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-zinc-400 text-sm">Total: </span>
          <span className="font-display text-2xl text-zinc-900">${total.toLocaleString('es-AR')}</span>
          {promoApplied && <span className="text-xs text-green-400 ml-2">promo x4 cookies aplicada</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={isPending}
            className="bg-zinc-900 text-white font-display text-base tracking-widest px-6 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap">
            {isPending ? 'CREANDO...' : '+ CREAR PEDIDO'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
export default function OrdersTab({ orders, setOrders, products, promos }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; products: Product[]; promos: Promo[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editOrderForm, setEditOrderForm] = useState<{ customerName: string; phone: string; notes: string; qtys: Record<string, number>; customTotal: string } | null>(null)
  const [filterName, setFilterName] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const activeProducts = products.filter((p) => p.active)

  const editItems = editOrderForm
    ? activeProducts
        .filter((p) => (editOrderForm.qtys[p.id] ?? 0) > 0)
        .map((p) => ({ productId: p.id, productName: p.name, qty: editOrderForm.qtys[p.id], unitPrice: p.priceValue }))
    : []
  const editQtys          = editOrderForm?.qtys ?? {}
  const editCalcTotal     = calcTotal(editQtys, activeProducts, promos)
  const editUnitTotal     = editItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const editPromoApplied  = editCalcTotal < editUnitTotal
  const customTotalNum    = Number(editOrderForm?.customTotal ?? '')
  const editTotal         = editOrderForm?.customTotal && customTotalNum > 0 ? customTotalNum : editCalcTotal

  const handleStatus = (id: string, status: Order['status']) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, status)
      if (res.ok) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este pedido?')) return
    startTransition(async () => {
      const res = await deleteOrder(id)
      if (res.ok) setOrders((prev) => prev.filter((o) => o.id !== id))
    })
  }

  const startEditOrder = (o: Order) => {
    const qtys: Record<string, number> = {}
    for (const item of o.items) qtys[item.productId] = item.qty
    setEditOrderForm({ customerName: o.customerName, phone: o.phone, notes: o.notes, qtys, customTotal: '' })
    setEditingOrderId(o.id)
  }

  const handleSaveOrder = (id: string) => {
    if (!editOrderForm) return
    startTransition(async () => {
      const res = await updateOrder(id, {
        customerName: editOrderForm.customerName,
        phone: editOrderForm.phone,
        notes: editOrderForm.notes,
        items: editItems,
        total: editTotal,
      })
      if (res.ok) {
        setOrders((prev) => prev.map((o) =>
          o.id === id
            ? { ...o, customerName: editOrderForm.customerName, phone: editOrderForm.phone, notes: editOrderForm.notes, items: editItems, total: editTotal }
            : o
        ))
        setEditingOrderId(null)
        setEditOrderForm(null)
      }
    })
  }

  const filteredOrders = orders.filter((o) => {
    const nameMatch = !filterName.trim() || o.customerName.toLowerCase().includes(filterName.toLowerCase())
    const dateMatch = !filterDate || o.createdAt.startsWith(filterDate)
    return nameMatch && dateMatch
  })

  return (
    <div>
      <NewOrderForm products={products} promos={promos} onCreated={(o) => setOrders((prev) => [o, ...prev])} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="bg-white border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-400 w-full"
        />
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-white border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 w-full cursor-pointer"
        >
          <option value="">todas las fechas</option>
          {[...new Set(orders.map((o) => o.createdAt.slice(0, 10)))].sort().reverse().map((d) => (
            <option key={d} value={d}>
              {new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-12 tracking-widest">// sin pedidos aún</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-zinc-400 text-sm text-center py-8 tracking-widest">// sin resultados para ese filtro</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map((o) => (
            <div key={o.id} className={`border border-dashed bg-white p-4 transition-all ${editingOrderId === o.id ? 'border-zinc-400 shadow-sm' : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'}`}>
              {editingOrderId === o.id && editOrderForm ? (
                <>
                  <p className="text-zinc-400 text-[0.6rem] tracking-[0.3em] uppercase mb-4">// editando · {o.customerName}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <input
                      placeholder="Nombre del cliente"
                      value={editOrderForm.customerName}
                      onChange={(e) => setEditOrderForm((f) => f && ({ ...f, customerName: e.target.value }))}
                      className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 w-full"
                    />
                    <input
                      placeholder="Teléfono / WhatsApp"
                      value={editOrderForm.phone}
                      onChange={(e) => setEditOrderForm((f) => f && ({ ...f, phone: e.target.value }))}
                      className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {activeProducts.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 border border-dashed border-zinc-200 bg-zinc-100 px-2 sm:px-3 py-2">
                        <span className="text-base sm:text-lg select-none shrink-0">{p.emoji}</span>
                        <span className="text-xs text-zinc-400 flex-1 truncate">{p.name}</span>
                        <input
                          type="number" min={0} max={99}
                          value={editOrderForm.qtys[p.id] ?? 0}
                          onChange={(e) => setEditOrderForm((f) => f && ({ ...f, qtys: { ...f.qtys, [p.id]: Math.max(0, Number(e.target.value)) } }))}
                          className="w-10 sm:w-12 bg-zinc-100/30 border border-dashed border-zinc-200 text-zinc-900 text-center text-sm px-1 py-1 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <textarea
                    rows={2} placeholder="Notas (dirección, aclaraciones, etc.)"
                    value={editOrderForm.notes}
                    onChange={(e) => setEditOrderForm((f) => f && ({ ...f, notes: e.target.value }))}
                    className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none mb-4 placeholder:text-zinc-600"
                  />
                  <div className="border-t border-dashed border-zinc-200 pt-4 mt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-xs shrink-0">calculado:</span>
                          <span className="font-display text-lg text-zinc-400">${editCalcTotal.toLocaleString('es-AR')}</span>
                          {editPromoApplied && <span className="text-xs text-green-400">promo aplicada</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-zinc-500 text-xs shrink-0">precio acordado $</label>
                          <input
                            type="number"
                            min={0}
                            value={editOrderForm.customTotal}
                            onChange={(e) => setEditOrderForm((f) => f && ({ ...f, customTotal: e.target.value }))}
                            placeholder={String(editCalcTotal)}
                            className="w-32 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg px-3 py-1 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-400"
                          />
                          {editOrderForm.customTotal && customTotalNum > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditOrderForm((f) => f && ({ ...f, customTotal: '' }))}
                              className="text-zinc-400 hover:text-zinc-700 text-xs transition-colors"
                              title="Volver al calculado"
                            >✕</button>
                          )}
                        </div>
                        <p className="font-display text-2xl text-zinc-900">${editTotal.toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex items-center gap-3 self-end">
                        <button
                          type="button"
                          onClick={() => { setEditingOrderId(null); setEditOrderForm(null) }}
                          className="text-zinc-400 text-xs tracking-widest hover:text-zinc-700 transition-colors rounded hover:bg-zinc-100 px-3 py-2"
                        >cancelar</button>
                        <button
                          type="button"
                          onClick={() => handleSaveOrder(o.id)}
                          disabled={isPending}
                          className="bg-zinc-900 text-white font-display text-base tracking-widest px-6 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
                        >{isPending ? 'GUARDANDO...' : 'GUARDAR'}</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-display text-xl text-zinc-900 tracking-wide leading-none">{o.customerName}</p>
                      <p className="text-zinc-400 text-xs mt-1">{o.phone}</p>
                      <p className="text-zinc-600 text-[0.6rem] mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatus(o.id, e.target.value as Order['status'])}
                        disabled={isPending}
                        className={`text-xs tracking-widest uppercase border border-dashed px-2 sm:px-3 py-1.5 bg-transparent focus:outline-none cursor-pointer ${STATUS_COLORS[o.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-white text-zinc-900 normal-case">{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => startEditOrder(o)}
                        className="text-zinc-600 hover:text-zinc-900 transition-colors text-xs px-2 py-1.5 rounded hover:bg-zinc-100 border border-dashed border-transparent hover:border-zinc-300"
                        title="Editar pedido"
                      >✎</button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-2 py-1.5 rounded hover:bg-red-50 border border-dashed border-transparent hover:border-red-200"
                      >✕</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {o.items.map((item) => (
                      <span key={item.productId} className="text-xs bg-zinc-100 border border-dashed border-zinc-200 px-2 py-1 text-zinc-400">
                        {item.qty}× {item.productName}
                      </span>
                    ))}
                  </div>
                  {o.notes && (
                    <p className="text-zinc-500 text-xs italic border-l-2 border-dashed border-zinc-200 pl-3 mb-2">{o.notes}</p>
                  )}
                  <p className="font-display text-xl text-zinc-900">${o.total.toLocaleString('es-AR')}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
