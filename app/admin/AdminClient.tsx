'use client'

import { useState, useTransition, useRef } from 'react'
import { createProduct, updateProduct, uploadProductImage, addOrder, updateOrderStatus, deleteOrder, addExpense, deleteExpense, logout } from '../actions'
import type { Product, Order, OrderItem, Expense, ExpenseCategory } from '../lib/data'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ingredientes', 'packaging', 'servicios', 'transporte', 'equipamiento', 'marketing', 'otro',
]

const STATUS_COLORS: Record<Order['status'], string> = {
  pendiente:    'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  'en proceso': 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  listo:        'bg-green-400/20 text-green-300 border-green-400/30',
  entregado:    'bg-surface text-muted border-accent/10',
  cancelado:    'bg-red-400/20 text-red-300 border-red-400/30',
}
const STATUS_OPTIONS: Order['status'][] = ['pendiente', 'en proceso', 'listo', 'entregado', 'cancelado']

// ─── Image Upload ────────────────────────────────────────────────────────────
function ImageUpload({ product, onUploaded }: { product: Product; onUploaded: (path: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>(product.image ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('productId', product.id)
      const res = await uploadProductImage(fd)
      if (res.ok && res.image) {
        setPreview(res.image)
        onUploaded(res.image)
      } else {
        setPreview(product.image ?? '')
        setError(res.error ?? 'Error al subir')
      }
    } catch {
      setPreview(product.image ?? '')
      setError('Error al subir la imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-3">
      <p className="text-muted/60 text-[0.6rem] tracking-widest uppercase mb-1.5">Imagen del producto</p>
      <div
        className="relative border-2 border-dashed border-accent/25 overflow-hidden cursor-pointer hover:border-accent/60 transition-colors group"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={product.name}
            className="w-full h-28 sm:h-32 object-cover"
          />
        ) : (
          <div className="h-28 sm:h-32 flex flex-col items-center justify-center gap-1 bg-surface-alt">
            <span className="text-3xl select-none opacity-40">{product.emoji}</span>
            <span className="text-muted/40 text-[0.6rem] tracking-widest">TAP PARA SUBIR</span>
          </div>
        )}

        {/* hover overlay */}
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-accent text-xs tracking-widest font-display">
            {preview ? 'CAMBIAR' : 'SUBIR'}
          </span>
        </div>

        {/* uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
            <span className="text-accent text-xs tracking-widest animate-pulse">SUBIENDO...</span>
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-[0.6rem] mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─── New Product Form ────────────────────────────────────────────────────────
function NewProductForm({ onCreated }: { onCreated: (p: Product) => void }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ emoji: '🍪', name: '', desc: '', tag: '', priceValue: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = Number(form.priceValue)
    if (!form.name || !price || price <= 0) {
      setError('Nombre y precio son obligatorios')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await createProduct({ ...form, priceValue: price })
      if (!res.ok || !res.product) { setError(res.error ?? 'Error'); return }
      onCreated(res.product)
      setForm({ emoji: '🍪', name: '', desc: '', tag: '', priceValue: '' })
      setOpen(false)
    })
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border border-dashed border-accent/40 text-accent font-display text-base tracking-widest px-4 py-3 hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
      >
        {open ? '✕ CANCELAR' : '+ NUEVO PRODUCTO'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border border-dashed border-accent/20 border-t-0 bg-surface p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="flex gap-2">
              <input
                className="w-12 bg-surface-alt border border-dashed border-accent/20 text-2xl text-center focus:outline-none focus:border-accent/50 py-2"
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                title="Emoji"
              />
              <input
                className="flex-1 bg-surface-alt border border-dashed border-accent/20 text-foreground font-display text-lg tracking-wide px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-muted/40"
                placeholder="Nombre del producto"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <input
              className="bg-surface-alt border border-dashed border-accent/20 text-accent text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-muted/40"
              placeholder="Tag (ej: NUEVO, CLÁSICO)"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            />
          </div>

          <textarea
            rows={2}
            className="w-full bg-surface-alt border border-dashed border-accent/20 text-muted/80 text-sm px-3 py-2 focus:outline-none focus:border-accent/50 resize-none mb-3 placeholder:text-muted/40"
            placeholder="Descripción del producto"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-muted text-xs shrink-0">Precio $</label>
              <input
                type="number"
                min={1}
                className="w-32 bg-surface-alt border border-dashed border-accent/20 text-accent font-display text-lg px-3 py-1.5 focus:outline-none focus:border-accent/50 placeholder:text-muted/40"
                placeholder="0"
                value={form.priceValue}
                onChange={(e) => setForm((f) => ({ ...f, priceValue: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="bg-accent text-background font-display text-base tracking-widest px-6 py-2 hover:bg-accent-dim transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isPending ? 'CREANDO...' : 'CREAR'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Products Tab ────────────────────────────────────────────────────────────
function ProductsTab({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products)

  const [saving, setSaving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const handleChange = (id: string, field: keyof Product, value: string | number | boolean) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleSave = (id: string) => {
    const product = items.find((p) => p.id === id)
    if (!product) return
    setSaving(id)
    startTransition(async () => {
      const res = await updateProduct(id, {
        name: product.name, desc: product.desc, price: product.price,
        priceValue: product.priceValue, tag: product.tag, emoji: product.emoji, active: product.active,
      })
      setFeedback((f) => ({ ...f, [id]: res.ok ? '✓ Guardado' : (res.error ?? 'Error') }))
      setSaving(null)
      setTimeout(() => setFeedback((f) => ({ ...f, [id]: '' })), 2500)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <NewProductForm onCreated={(p) => setItems((prev) => [...prev, p])} />
      {items.map((p) => (
        <div
          key={p.id}
          className={`border border-dashed border-accent/20 bg-surface p-4 sm:p-5 transition-opacity ${!p.active ? 'opacity-50' : ''}`}
        >
          {/* row 1: emoji + toggle + name + tag */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-3 shrink-0">
              <input
                className="w-9 bg-transparent text-2xl focus:outline-none"
                value={p.emoji}
                onChange={(e) => handleChange(p.id, 'emoji', e.target.value)}
                title="Emoji"
              />
              {/* toggle */}
              <button
                type="button"
                onClick={() => handleChange(p.id, 'active', !p.active)}
                className={`w-10 h-5 rounded-full border border-dashed transition-colors flex items-center px-0.5 shrink-0 ${p.active ? 'bg-accent/30 border-accent/50' : 'bg-surface-alt border-accent/20'}`}
                title={p.active ? 'Ocultar producto' : 'Mostrar producto'}
              >
                <div className={`w-4 h-4 rounded-full transition-transform ${p.active ? 'bg-accent translate-x-5' : 'bg-muted/40'}`} />
              </button>
              <span className="text-muted/50 text-[0.6rem]">{p.active ? 'visible' : 'oculto'}</span>
            </div>
            <input
              className="flex-1 bg-surface-alt border border-dashed border-accent/20 text-foreground font-display text-lg sm:text-xl tracking-wide px-3 py-2 focus:outline-none focus:border-accent/50 min-w-0"
              value={p.name}
              onChange={(e) => handleChange(p.id, 'name', e.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full sm:w-28 bg-surface-alt border border-dashed border-accent/20 text-accent text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-accent/50"
              value={p.tag}
              onChange={(e) => handleChange(p.id, 'tag', e.target.value)}
              placeholder="Tag"
            />
          </div>

          {/* row 2: desc */}
          <textarea
            rows={2}
            className="w-full bg-surface-alt border border-dashed border-accent/20 text-muted/80 text-sm px-3 py-2 focus:outline-none focus:border-accent/50 resize-none mb-3"
            value={p.desc}
            onChange={(e) => handleChange(p.id, 'desc', e.target.value)}
            placeholder="Descripción"
          />

          {/* row 3: image upload */}
          <ImageUpload
            product={p}
            onUploaded={(img) => handleChange(p.id, 'image', img)}
          />

          {/* row 4: price + save */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mt-4 pt-4 border-t border-dashed border-accent/10">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-muted text-xs shrink-0">Precio $</label>
              <input
                type="number"
                min={0}
                className="w-28 bg-surface-alt border border-dashed border-accent/20 text-accent font-display text-lg px-3 py-1.5 focus:outline-none focus:border-accent/50"
                value={p.priceValue}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  handleChange(p.id, 'priceValue', v)
                  handleChange(p.id, 'price', `$${v.toLocaleString('es-AR')}`)
                }}
              />
              <span className="text-muted/30 text-xs">→ se muestra: {p.price}</span>
            </div>
            <div className="flex items-center gap-3">
              {feedback[p.id] && <span className="text-xs text-green-400">{feedback[p.id]}</span>}
              <button
                onClick={() => handleSave(p.id)}
                disabled={saving === p.id}
                className="bg-accent text-background font-display text-base tracking-widest px-6 py-2 hover:bg-accent-dim transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {saving === p.id ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── New Order Form ───────────────────────────────────────────────────────────
function NewOrderForm({ products, onCreated }: { products: Product[]; onCreated: (o: Order) => void }) {
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

  const totalQty = items.reduce((s, i) => s + i.qty, 0)
  const packs4   = Math.floor(totalQty / 4)
  const rest     = totalQty % 4
  const total    = totalQty >= 4 ? packs4 * 16000 + rest * 4500 : items.reduce((s, i) => s + i.qty * i.unitPrice, 0)

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
    <form onSubmit={handleSubmit} className="border border-dashed border-accent/30 bg-surface p-4 sm:p-5 mb-6">
      <p className="text-muted text-[0.6rem] tracking-[0.3em] uppercase mb-4">// nuevo pedido</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          placeholder="Nombre del cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 w-full"
        />
        <input
          placeholder="Teléfono / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 w-full"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {active.map((p) => (
          <div key={p.id} className="flex items-center gap-2 border border-dashed border-accent/10 bg-surface-alt px-2 sm:px-3 py-2">
            <span className="text-base sm:text-lg select-none shrink-0">{p.emoji}</span>
            <span className="text-xs text-foreground/70 flex-1 truncate">{p.name}</span>
            <input
              type="number" min={0} max={99}
              value={qtys[p.id] ?? 0}
              onChange={(e) => setQtys((q) => ({ ...q, [p.id]: Math.max(0, Number(e.target.value)) }))}
              className="w-10 sm:w-12 bg-background/30 border border-dashed border-accent/20 text-accent text-center text-sm px-1 py-1 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <textarea
        rows={2} placeholder="Notas (dirección, aclaraciones, etc.)"
        value={notes} onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-surface-alt border border-dashed border-accent/20 text-muted/80 text-sm px-3 py-2 focus:outline-none focus:border-accent/50 resize-none mb-4 placeholder:text-muted/40"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-muted text-sm">Total: </span>
          <span className="font-display text-2xl text-accent">${total.toLocaleString('es-AR')}</span>
          {totalQty >= 4 && <span className="text-xs text-green-400 ml-2">promo x4 aplicada</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={isPending}
            className="bg-accent text-background font-display text-base tracking-widest px-6 py-2 hover:bg-accent-dim transition-colors disabled:opacity-50 whitespace-nowrap">
            {isPending ? 'CREANDO...' : '+ CREAR PEDIDO'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ initialOrders, products }: { initialOrders: Order[]; products: Product[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [isPending, startTransition] = useTransition()

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

  return (
    <div>
      <NewOrderForm products={products} onCreated={(o) => setOrders((prev) => [o, ...prev])} />

      {orders.length === 0 ? (
        <p className="text-muted/30 text-sm text-center py-12 tracking-widest">// sin pedidos aún</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="border border-dashed border-accent/20 bg-surface p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-display text-xl text-foreground tracking-wide leading-none">{o.customerName}</p>
                  <p className="text-muted text-xs mt-1">{o.phone}</p>
                  <p className="text-muted/30 text-[0.6rem] mt-0.5">
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
                      <option key={s} value={s} className="bg-surface text-foreground normal-case">{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="text-muted/30 hover:text-red-400 transition-colors text-xs px-2 py-1.5 border border-dashed border-transparent hover:border-red-400/30"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {o.items.map((item) => (
                  <span key={item.productId} className="text-xs bg-surface-alt border border-dashed border-accent/15 px-2 py-1 text-foreground/70">
                    {item.qty}× {item.productName}
                  </span>
                ))}
              </div>

              {o.notes && (
                <p className="text-muted/50 text-xs italic border-l-2 border-dashed border-accent/20 pl-3 mb-2">{o.notes}</p>
              )}

              <p className="font-display text-xl text-accent">${o.total.toLocaleString('es-AR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Gastos Tab ───────────────────────────────────────────────────────────────
function GastosTab({ initialExpenses, orders }: { initialExpenses: Expense[]; orders: Order[] }) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthOrders = orders.filter(
    (o) => o.status === 'entregado' && o.createdAt.startsWith(thisMonth)
  )
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth))
  const monthIngresos = monthOrders.reduce((s, o) => s + o.total, 0)
  const monthGastos   = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const monthGanancia = monthIngresos - monthGastos

  const totalIngresos = orders.filter((o) => o.status === 'entregado').reduce((s, o) => s + o.total, 0)
  const totalGastos   = expenses.reduce((s, e) => s + e.amount, 0)
  const totalGanancia = totalIngresos - totalGastos

  // Add expense form state
  const [form, setForm] = useState({
    date: now.toISOString().slice(0, 10),
    desc: '',
    category: 'ingredientes' as ExpenseCategory,
    amount: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.desc || !amount || amount <= 0) {
      setError('Completá descripción y monto')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await addExpense({ date: form.date, desc: form.desc, category: form.category, amount })
      if (!res.ok) { setError(res.error ?? 'Error'); return }
      const newExp: Expense = { id: res.id!, date: form.date, desc: form.desc, category: form.category, amount }
      setExpenses((prev) => [newExp, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      setForm((f) => ({ ...f, desc: '', amount: '' }))
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    startTransition(async () => {
      const res = await deleteExpense(id)
      if (res.ok) setExpenses((prev) => prev.filter((e) => e.id !== id))
    })
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'INGRESOS', value: monthIngresos, color: 'text-green-400' },
          { label: 'GASTOS',   value: monthGastos,   color: 'text-red-400' },
          { label: 'GANANCIA', value: monthGanancia, color: monthGanancia >= 0 ? 'text-accent' : 'text-red-400' },
        ].map((card) => (
          <div key={card.label} className="border border-dashed border-accent/20 bg-surface p-3 sm:p-4 text-center">
            <p className="text-muted/50 text-[0.5rem] sm:text-[0.6rem] tracking-[0.3em] uppercase mb-1">{card.label}</p>
            <p className={`font-display text-xl sm:text-2xl leading-none ${card.color}`}>
              ${card.value.toLocaleString('es-AR')}
            </p>
          </div>
        ))}
      </div>

      <p className="text-muted/30 text-[0.55rem] tracking-widest uppercase text-center mb-6">
        // mes actual · totales históricos: ingresos ${totalIngresos.toLocaleString('es-AR')} · gastos ${totalGastos.toLocaleString('es-AR')} · ganancia ${totalGanancia.toLocaleString('es-AR')}
      </p>

      {/* Add expense form */}
      <form onSubmit={handleAdd} className="border border-dashed border-accent/30 bg-surface p-4 sm:p-5 mb-6">
        <p className="text-muted text-[0.6rem] tracking-[0.3em] uppercase mb-4">// registrar gasto</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 w-full"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 w-full cursor-pointer"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-surface">{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            className="sm:col-span-2 bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 w-full"
            placeholder="Descripción (ej: harina x5kg)"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            className="bg-surface-alt border border-dashed border-accent/20 text-accent font-display text-lg px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 w-full"
            placeholder="Monto $"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-background font-display text-base tracking-widest px-6 py-2 hover:bg-accent-dim transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? 'GUARDANDO...' : '+ AGREGAR GASTO'}
            </button>
          </div>
        </div>
      </form>

      {/* Expense list */}
      {sorted.length === 0 ? (
        <p className="text-muted/30 text-sm text-center py-12 tracking-widest">// sin gastos registrados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((exp) => (
            <div key={exp.id} className="border border-dashed border-accent/15 bg-surface p-3 sm:p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-[0.55rem] tracking-widest uppercase bg-accent/10 text-accent border border-dashed border-accent/20 px-1.5 py-0.5 leading-none shrink-0">
                    {exp.category}
                  </span>
                  <span className="text-muted/40 text-[0.6rem]">
                    {new Date(exp.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-foreground/80 text-sm truncate">{exp.desc}</p>
              </div>
              <p className="font-display text-xl text-red-400 shrink-0">${exp.amount.toLocaleString('es-AR')}</p>
              <button
                onClick={() => handleDelete(exp.id)}
                className="text-muted/30 hover:text-red-400 transition-colors text-xs px-2 py-1.5 border border-dashed border-transparent hover:border-red-400/30 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminClient({ initialProducts, initialOrders, initialExpenses }: { initialProducts: Product[]; initialOrders: Order[]; initialExpenses: Expense[] }) {
  const [tab, setTab] = useState<'pedidos' | 'productos' | 'gastos'>('pedidos')
  const [, startTransition] = useTransition()

  const pendingCount = initialOrders.filter(
    (o) => o.status === 'pendiente' || o.status === 'en proceso'
  ).length

  const handleLogout = () => {
    startTransition(async () => { await logout() })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* topbar */}
      <nav className="bg-surface-alt border-b border-dashed border-accent/20 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 gap-3">
        <span className="font-display text-base sm:text-xl text-accent tracking-widest whitespace-nowrap shrink-0">
          * PAZ BAKERY
        </span>

        <div className="flex gap-1 overflow-x-auto">
          {(['pedidos', 'productos', 'gastos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[0.6rem] sm:text-xs tracking-widest uppercase px-3 sm:px-4 py-2 border border-dashed transition-colors whitespace-nowrap ${tab === t ? 'border-accent text-accent bg-accent/10' : 'border-transparent text-muted hover:text-accent'}`}
            >
              {t}
              {t === 'pedidos' && pendingCount > 0 && (
                <span className="ml-1 bg-accent text-background text-[0.5rem] px-1 py-0.5 font-bold leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a href="/" className="text-muted/40 text-xs hover:text-accent transition-colors hidden sm:block">
            ← sitio
          </a>
          <button
            onClick={handleLogout}
            className="text-muted/40 text-xs hover:text-red-400 transition-colors border border-dashed border-transparent hover:border-red-400/30 px-2 py-1"
          >
            salir
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'productos' && (
          <>
            <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // productos · editá precio, descripción, imagen y visibilidad
            </p>
            <ProductsTab products={initialProducts} />
          </>
        )}
        {tab === 'pedidos' && (
          <>
            <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // pedidos · cargá nuevos y actualizá el estado
            </p>
            <OrdersTab initialOrders={initialOrders} products={initialProducts} />
          </>
        )}
        {tab === 'gastos' && (
          <>
            <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // gastos · registrá costos y controlá ganancias del mes
            </p>
            <GastosTab initialExpenses={initialExpenses} orders={initialOrders} />
          </>
        )}
      </div>
    </div>
  )
}
