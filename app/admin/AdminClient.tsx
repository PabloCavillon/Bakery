'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createProduct, updateProduct, uploadProductImage, addOrder, updateOrderStatus, deleteOrder, addExpense, deleteExpense, updateSiteColors, updateSiteFonts, logout } from '../actions'
import type { Product, Order, OrderItem, Expense, ExpenseCategory, SiteColors, SiteFonts } from '../lib/data'

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

// ─── Focal Point Picker ───────────────────────────────────────────────────────
function FocalPointPicker({
  src, position, zoom, onChange, onZoomChange,
}: {
  src: string
  position: string
  zoom: number
  onChange: (p: string) => void
  onZoomChange: (z: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const getPct = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)))
    return `${x}% ${y}%`
  }

  const clampZoom = (z: number) => Math.round(Math.max(1, Math.min(3, z)) * 100) / 100

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    onZoomChange(clampZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
  }

  const parts = position.split(' ')
  const cx = parseFloat(parts[0]) || 50
  const cy = parseFloat(parts[1]) || 50

  return (
    <div className="mt-2">
      <p className="text-muted/50 text-[0.55rem] tracking-widest uppercase mb-1.5">
        encuadre — arrastrá · scroll o slider para zoom
      </p>
      <div
        ref={ref}
        className="relative w-full aspect-video overflow-hidden cursor-crosshair select-none border border-dashed border-accent/30"
        onPointerDown={(e) => {
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
          onChange(getPct(e))
        }}
        onPointerMove={(e) => { if (dragging) onChange(getPct(e)) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onWheel={handleWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: position,
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: position,
          }}
          draggable={false}
        />
        {/* rule-of-thirds grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '33.333% 33.333%',
          }}
        />
        {/* focal point crosshair */}
        <div
          className="absolute pointer-events-none"
          style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-5 h-5 rounded-full border-2 border-white shadow-md bg-black/25" />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom - 0.1))}
          className="text-muted/50 hover:text-accent transition-colors text-base leading-none px-1 select-none"
        >−</button>
        <input
          type="range"
          min={1} max={3} step={0.05}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom + 0.1))}
          className="text-muted/50 hover:text-accent transition-colors text-base leading-none px-1 select-none"
        >+</button>
        <span className="text-[0.6rem] text-muted/40 w-8 text-right tabular-nums">{zoom.toFixed(1)}×</span>
      </div>
    </div>
  )
}

// ─── Image Upload ────────────────────────────────────────────────────────────
function ImageUpload({
  product, onUploaded, imagePosition, onPositionChange, imageZoom, onZoomChange,
}: {
  product: Product
  onUploaded: (path: string) => void
  imagePosition?: string
  onPositionChange: (pos: string) => void
  imageZoom?: number
  onZoomChange: (z: number) => void
}) {
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

  const pos = imagePosition ?? 'center center'

  return (
    <div className="mt-3">
      <p className="text-muted/60 text-[0.6rem] tracking-widest uppercase mb-1.5">Imagen del producto</p>
      <div
        className="relative aspect-video border-2 border-dashed border-accent/25 overflow-hidden cursor-pointer hover:border-accent/60 transition-colors group"
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
            className="w-full h-full object-cover"
            style={{ objectPosition: pos }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-surface-alt">
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

      {/* Focal point picker — only when there's an image */}
      {preview && (
        <FocalPointPicker
          src={preview}
          position={pos}
          zoom={imageZoom ?? 1}
          onChange={onPositionChange}
          onZoomChange={onZoomChange}
        />
      )}
    </div>
  )
}

// ─── New Product Form ────────────────────────────────────────────────────────
function NewProductForm({ onCreated }: { onCreated: (p: Product) => void }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ emoji: '🍪', name: '', desc: '', tag: '', priceValue: '', category: '' })

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
      setForm({ emoji: '🍪', name: '', desc: '', tag: '', priceValue: '', category: '' })
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
                className="flex-1 bg-surface-alt border border-dashed border-accent/20 text-foreground font-display text-lg tracking-wide px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-foreground/40"
                placeholder="Nombre del producto"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <input
              className="bg-surface-alt border border-dashed border-accent/20 text-accent text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-accent/50"
              placeholder="Tag (ej: NUEVO, CLÁSICO)"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            />
          </div>

          <input
            className="w-full bg-surface-alt border border-dashed border-accent/20 text-muted text-xs tracking-wide px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 mb-3"
            placeholder="Categoría (ej: Cookies, Tartas, Tortas)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />

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
                className="w-32 bg-surface-alt border border-dashed border-accent/20 text-accent font-display text-lg px-3 py-1.5 focus:outline-none focus:border-accent/50 placeholder:text-accent/50"
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
        imagePosition: product.imagePosition, imageZoom: product.imageZoom, category: product.category,
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
          <input
            className="w-full bg-surface-alt border border-dashed border-accent/20 text-muted text-xs tracking-wide px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-muted/40 mb-3"
            placeholder="Categoría (ej: Cookies, Tartas, Tortas)"
            value={p.category ?? ''}
            onChange={(e) => handleChange(p.id, 'category', e.target.value)}
          />

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
            imagePosition={p.imagePosition}
            onPositionChange={(pos) => handleChange(p.id, 'imagePosition', pos)}
            imageZoom={p.imageZoom}
            onZoomChange={(z) => handleChange(p.id, 'imageZoom', z)}
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
          className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-foreground/40 w-full"
        />
        <input
          placeholder="Teléfono / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-foreground/40 w-full"
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
function OrdersTab({ orders, setOrders, products }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; products: Product[] }) {
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
function GastosTab({ expenses, setExpenses, orders }: { expenses: Expense[]; setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>; orders: Order[] }) {
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
            className="sm:col-span-2 bg-surface-alt border border-dashed border-accent/20 text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-accent/50 placeholder:text-foreground/40 w-full"
            placeholder="Descripción (ej: harina x5kg)"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            className="bg-surface-alt border border-dashed border-accent/20 text-accent font-display text-lg px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-accent/50 w-full"
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

// ─── Appearance Tab ───────────────────────────────────────────────────────────
const DISPLAY_FONTS = [
  { id: 'luckiest-guy', label: 'Luckiest Guy', var: '--font-luckiest' },
  { id: 'bebas-neue',   label: 'Bebas Neue',   var: '--font-bebas'    },
  { id: 'righteous',    label: 'Righteous',    var: '--font-righteous' },
  { id: 'paytone-one',  label: 'Paytone One',  var: '--font-paytone'  },
  { id: 'fredoka',      label: 'Fredoka',      var: '--font-fredoka'  },
]

const BODY_FONTS = [
  { id: 'nunito',  label: 'Nunito',  var: '--font-nunito'  },
  { id: 'inter',   label: 'Inter',   var: '--font-inter'   },
  { id: 'dm-sans', label: 'DM Sans', var: '--font-dm-sans' },
  { id: 'outfit',  label: 'Outfit',  var: '--font-outfit'  },
]


function ColorsTab({ initialColors, initialFonts }: { initialColors: SiteColors; initialFonts: SiteFonts }) {
  const [colors, setColors] = useState(initialColors)
  const [fonts, setFonts] = useState(initialFonts)
  const [isPendingColors, startColors] = useTransition()
  const [isPendingFonts, startFonts] = useTransition()
  const [savedColors, setSavedColors] = useState(false)
  const [savedFonts, setSavedFonts] = useState(false)

  const set = (key: keyof SiteColors, value: string) =>
    setColors((prev) => ({ ...prev, [key]: value }))

  const handleSaveColors = () => {
    startColors(async () => {
      const res = await updateSiteColors(colors)
      if (res.ok) { setSavedColors(true); setTimeout(() => setSavedColors(false), 2500) }
    })
  }

  const handleSaveFonts = () => {
    startFonts(async () => {
      const res = await updateSiteFonts(fonts)
      if (res.ok) { setSavedFonts(true); setTimeout(() => setSavedFonts(false), 2500) }
    })
  }

  const handleReset = () => { setColors(initialColors); setFonts(initialFonts) }

  const pv = {
    '--bg':           colors.bg,
    '--surface':      colors.surface,
    '--surface-alt':  colors.surfaceAlt,
    '--accent':       colors.accent,
    '--fg':           colors.fg,
    '--muted':        colors.muted,
    '--rose':         colors.rose,
    '--nav-bg':       colors.navBg,
    '--nav-text':     colors.navText,
    '--card-bg':      colors.cardBg,
    '--card-border':  colors.cardBorder,
    '--card-title':   colors.cardTitle,
    '--card-desc':    colors.cardDesc,
    '--card-price':   colors.cardPrice,
    '--card-tag-bg':  colors.cardTagBg,
    '--btn-bg':       colors.btnBg,
    '--btn-text':     colors.btnText,
    '--font-display': `var(${DISPLAY_FONTS.find(f => f.id === fonts.display)?.var ?? '--font-luckiest'}), cursive`,
    '--font-sans':    `var(${BODY_FONTS.find(f => f.id === fonts.sans)?.var ?? '--font-nunito'}), sans-serif`,
  } as React.CSSProperties

  const picker = (sid: string, k: keyof SiteColors, label: string, note?: string) => (
    <div className="border border-dashed border-zinc-700 bg-zinc-900 p-3 flex items-center gap-3">
      <div className="relative shrink-0">
        <div className="w-9 h-9 border border-zinc-600 cursor-pointer" style={{ background: colors[k] }}
          onClick={() => (document.getElementById(`cp-${sid}-${k}`) as HTMLInputElement)?.click()} />
        <input id={`cp-${sid}-${k}`} type="color" value={colors[k]}
          onChange={(e) => set(k, e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-9 h-9" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-zinc-400 text-[0.6rem] tracking-widest uppercase mb-0.5">{label}</p>
        {note && <p className="text-zinc-600 text-[0.5rem] tracking-wide mb-1">{note}</p>}
        <input type="text" value={colors[k]} maxLength={7}
          onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) set(k, v) }}
          className="w-full bg-zinc-800 border border-dashed border-zinc-700 text-zinc-300 text-xs px-2 py-1 focus:outline-none focus:border-zinc-500 font-mono tracking-widest" />
      </div>
    </div>
  )

  return (
    <div>
      {/* ── Fuentes ── */}
      <div className="mb-8">
        <p className="text-zinc-500 text-[0.6rem] tracking-[0.3em] uppercase mb-3">// fuente de títulos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
          {DISPLAY_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFonts((prev) => ({ ...prev, display: f.id }))}
              className={`border border-dashed p-3 text-left transition-colors ${fonts.display === f.id ? 'border-zinc-400 bg-zinc-700' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
            >
              <p style={{ fontFamily: `var(${f.var})` }} className="text-zinc-200 text-xl leading-none mb-2 truncate">
                Hermanas Baking
              </p>
              <p className="text-zinc-500 text-[0.55rem] tracking-widest uppercase">{f.label}</p>
            </button>
          ))}
        </div>

        <p className="text-zinc-500 text-[0.6rem] tracking-[0.3em] uppercase mb-3">// fuente de texto</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {BODY_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFonts((prev) => ({ ...prev, sans: f.id }))}
              className={`border border-dashed p-3 text-left transition-colors ${fonts.sans === f.id ? 'border-zinc-400 bg-zinc-700' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
            >
              <p style={{ fontFamily: `var(${f.var})` }} className="text-zinc-200 text-sm leading-snug mb-2">
                Cookies artesanales por encargo.
              </p>
              <p className="text-zinc-500 text-[0.55rem] tracking-widest uppercase">{f.label}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveFonts}
            disabled={isPendingFonts}
            className="bg-[#5e9e1c] text-white font-display text-base tracking-widest px-8 py-2 hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {isPendingFonts ? 'GUARDANDO...' : savedFonts ? '✓ APLICADO' : 'APLICAR FUENTES'}
          </button>
        </div>
      </div>

      <div className="border-t border-dashed border-zinc-700 mb-6" />

      {/* ── Navegación ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// navegación</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <span className="font-display text-base tracking-widest" style={{ color: 'var(--nav-text)' }}>
              <span style={{ color: 'var(--rose)' }}>*</span> Hermanas Baking
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm tracking-wide" style={{ color: 'var(--muted)', opacity: 0.7 }}>Cookies</span>
              <span className="text-sm tracking-wide" style={{ color: 'var(--muted)', opacity: 0.7 }}>Pedidos</span>
              <span className="text-xs tracking-widest uppercase border border-dashed px-3 py-1.5"
                style={{ color: 'var(--btn-bg)', borderColor: 'color-mix(in srgb, var(--btn-bg) 50%, transparent)' }}>
                → pedir
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picker('nav', 'navBg', 'Fondo del nav')}
          {picker('nav', 'navText', 'Color del logo')}
        </div>
      </div>

      {/* ── Cards de productos ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// cards de productos</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="p-5" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              {[
                { name: 'COO-CHIPS',     tag: 'CLÁSICA',  emoji: '🍪', price: '$4.500', desc: 'Chocolate belga, manteca real.' },
                { name: 'COO-FRAMBUESA', tag: 'FAVORITA', emoji: '🍓', price: '$4.500', desc: 'Frambuesa y crema de vainilla.' },
              ].map((card) => (
                <div key={card.name} className="border border-dashed p-4"
                  style={{ borderColor: 'color-mix(in srgb, var(--card-border) 30%, transparent)', backgroundColor: 'var(--card-bg)' }}>
                  <div className="aspect-video mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: 'var(--surface-alt)' }}>
                    <span className="text-4xl select-none">{card.emoji}</span>
                    <span className="absolute top-2 right-2 text-[0.5rem] tracking-widest uppercase px-2 py-0.5"
                      style={{ backgroundColor: 'var(--card-tag-bg)', color: 'var(--bg)' }}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-xl leading-none mb-1" style={{ color: 'var(--card-title)' }}>{card.name}</h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--card-desc)' }}>{card.desc}</p>
                  <div className="flex items-center justify-between border-t border-dashed pt-3"
                    style={{ borderColor: 'color-mix(in srgb, var(--card-price) 15%, transparent)' }}>
                    <span className="font-display text-xl" style={{ color: 'var(--card-price)' }}>{card.price}</span>
                    <span className="text-[0.6rem] tracking-widest" style={{ color: 'var(--fg)', opacity: 0.25 }}>encargar →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {picker('cards', 'cardBg',     'Fondo de la card')}
          {picker('cards', 'cardBorder', 'Borde')}
          {picker('cards', 'cardTitle',  'Título del producto')}
          {picker('cards', 'cardDesc',   'Descripción')}
          {picker('cards', 'cardPrice',  'Precio')}
          {picker('cards', 'cardTagBg',  'Tag / etiqueta')}
        </div>
      </div>

      {/* ── Botones ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// botones</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="p-6 flex flex-wrap items-end gap-6" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-center">
              <div className="font-display text-xl tracking-widest px-8 py-3"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>
                PEDIR
              </div>
              <p className="text-muted/40 text-[0.5rem] tracking-widest mt-1.5">relleno</p>
            </div>
            <div className="text-center">
              <div className="font-display text-xl tracking-widest px-8 py-3 border-2"
                style={{ borderColor: 'var(--btn-bg)', color: 'var(--btn-bg)' }}>
                INSTAGRAM
              </div>
              <p className="text-muted/40 text-[0.5rem] tracking-widest mt-1.5">outline</p>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase border border-dashed px-4 py-2"
                style={{ color: 'var(--btn-bg)', borderColor: 'color-mix(in srgb, var(--btn-bg) 50%, transparent)' }}>
                → pedir
              </div>
              <p className="text-muted/40 text-[0.5rem] tracking-widest mt-1.5">nav</p>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picker('botones', 'btnBg', 'Fondo del botón')}
          {picker('botones', 'btnText', 'Texto del botón')}
        </div>
      </div>

      {/* ── Fondos ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// fondos y superficies</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="p-4" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="text-[0.5rem] tracking-widest uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.4 }}>fondo del sitio</p>
            <div className="p-4" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[0.5rem] tracking-widest uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.4 }}>paneles / formularios</p>
              <div className="h-10 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-alt)' }}>
                <span className="text-[0.5rem] tracking-widest uppercase" style={{ color: 'var(--muted)', opacity: 0.4 }}>superficie alternativa</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {picker('fondo', 'bg', 'Fondo del sitio')}
          {picker('fondo', 'surface', 'Paneles y formularios')}
          {picker('fondo', 'surfaceAlt', 'Superficie alternativa')}
        </div>
      </div>

      {/* ── Texto ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// texto</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="p-5" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="font-display text-4xl leading-none mb-3" style={{ color: 'var(--fg)' }}>HERMANAS BAKING</p>
            <p className="text-base leading-relaxed mb-2" style={{ color: 'var(--fg)' }}>
              Texto principal — cookies artesanales por encargo en Córdoba.
            </p>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--muted)' }}>
              Texto secundario — ingredientes reales, hecho a mano.
            </p>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', opacity: 0.5 }}>
              texto terciario — categorías y etiquetas
            </p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picker('texto', 'fg', 'Texto principal')}
          {picker('texto', 'muted', 'Texto secundario')}
        </div>
      </div>

      {/* ── Acentos de marca ── */}
      <div className="mb-5 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// acentos de marca</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-800">
          <div className="flex items-stretch">
            <div className="flex-1 py-4 px-5 flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <div className="text-center">
                <span className="font-display text-base tracking-widest block" style={{ color: 'var(--bg)' }}>ARTESANAL // COOKIES // CÓRDOBA</span>
                <span className="text-[0.5rem] tracking-widest block mt-1" style={{ color: 'var(--bg)', opacity: 0.6 }}>ticker · sección CTA</span>
              </div>
            </div>
            <div className="w-px" style={{ backgroundColor: 'color-mix(in srgb, var(--muted) 20%, transparent)' }} />
            <div className="flex-1 py-4 px-5 flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
              <div className="text-center">
                <span className="font-display text-2xl" style={{ color: 'var(--rose)' }}>* // →</span>
                <span className="text-[0.5rem] tracking-widest block mt-1" style={{ color: 'var(--muted)', opacity: 0.5 }}>rosa decorativo</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picker('marca', 'accent', 'Acento', 'ticker + sección CTA')}
          {picker('marca', 'rose', 'Rosa', 'flechas, asteriscos, detalles')}
        </div>
      </div>

      {/* ── Vista completa ── */}
      <div className="mb-6 border border-dashed border-zinc-600 overflow-hidden">
        <div className="bg-zinc-800 px-4 py-2 border-b border-dashed border-zinc-600">
          <p className="text-zinc-300 text-[0.55rem] tracking-[0.3em] uppercase">// vista completa</p>
        </div>
        <div style={pv} className="font-sans overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between border-b border-accent/20 px-3 py-2" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <span className="font-display text-[11px] tracking-widest" style={{ color: 'var(--nav-text)' }}>
              <span style={{ color: 'var(--rose)' }}>*</span> Hermanas Baking
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[8px] tracking-widest" style={{ color: 'var(--muted)', opacity: 0.6 }}>cookies</span>
              <span className="text-[8px] tracking-widest" style={{ color: 'var(--muted)', opacity: 0.6 }}>pedidos</span>
              <span className="text-[7px] border border-dashed px-2 py-0.5"
                style={{ color: 'var(--btn-bg)', borderColor: 'color-mix(in srgb, var(--btn-bg) 50%, transparent)' }}>→ pedir</span>
            </div>
          </div>
          {/* Ticker */}
          <div className="px-3 py-1.5 flex gap-3 overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
            {['ARTESANAL', '//', 'COOKIES', '//', 'CÓRDOBA', '//'].map((t, i) => (
              <span key={i} className="font-display text-[7px] tracking-widest whitespace-nowrap"
                style={{ color: t === '//' ? 'var(--rose)' : 'var(--bg)', opacity: t === '//' ? 1 : 0.9 }}>{t}</span>
            ))}
          </div>
          {/* Hero */}
          <div className="px-3 py-4 border-b border-dashed border-accent/15" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="font-display text-[26px] leading-none" style={{ color: 'var(--fg)' }}>HERMANAS</p>
            <p className="font-display text-[26px] leading-none ml-2 mb-2" style={{ color: 'var(--accent)' }}>BAKING</p>
            <p className="text-[7px] tracking-[0.2em] mb-3" style={{ color: 'var(--muted)' }}>COOKIES · TARTAS · TORTAS</p>
            <div className="flex gap-2 items-center">
              <span className="font-display text-[9px] tracking-widest px-3 py-1"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>PEDIR</span>
            </div>
          </div>
          {/* Cards */}
          <div className="px-3 py-3 border-b border-dashed border-accent/15" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'COO-CHIPS', tag: 'CLÁSICA', price: '$4.500' },
                { name: 'COO-FRAMBUESA', tag: 'FAVORITA', price: '$4.500' },
                { name: 'COO-LEMON', tag: 'FRESCA', price: '$4.500' },
              ].map((card) => (
                <div key={card.name} className="border border-dashed p-1.5"
                  style={{ borderColor: 'color-mix(in srgb, var(--card-border) 30%, transparent)', backgroundColor: 'var(--card-bg)' }}>
                  <div className="h-5 mb-1 flex items-end justify-end p-0.5" style={{ backgroundColor: 'var(--surface-alt)' }}>
                    <span className="text-[5px] px-0.5 leading-tight"
                      style={{ backgroundColor: 'var(--card-tag-bg)', color: 'var(--bg)' }}>{card.tag}</span>
                  </div>
                  <p className="font-display text-[7px] leading-none mb-0.5" style={{ color: 'var(--card-title)' }}>{card.name}</p>
                  <div className="flex items-center justify-between border-t border-dashed pt-0.5 mt-0.5"
                    style={{ borderColor: 'color-mix(in srgb, var(--card-price) 20%, transparent)' }}>
                    <span className="font-display text-[8px]" style={{ color: 'var(--card-price)' }}>{card.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* CTA */}
          <div className="px-3 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--accent)' }}>
            <span className="font-display text-[13px] leading-none" style={{ color: 'var(--bg)' }}>¡ENCARGÁ LAS TUYAS!</span>
            <div className="flex gap-1.5">
              <span className="font-display text-[6px] tracking-widest px-2 py-1"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>WHATSAPP</span>
              <span className="text-[6px] px-2 py-1"
                style={{ border: '1px solid var(--btn-bg)', color: 'var(--btn-bg)' }}>INSTAGRAM</span>
            </div>
          </div>
          {/* Footer */}
          <div className="px-3 py-2 flex items-center justify-between border-t border-dashed border-accent/20"
            style={{ backgroundColor: 'var(--surface-alt)' }}>
            <span className="font-display text-[9px]" style={{ color: 'var(--accent)' }}>
              <span style={{ color: 'var(--rose)' }}>*</span> Hermanas Baking
            </span>
            <span className="text-[6px] tracking-[0.15em] uppercase" style={{ color: 'var(--muted)', opacity: 0.5 }}>cookies · córdoba · 2026</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-zinc-700">
        <button
          type="button"
          onClick={handleReset}
          className="text-zinc-600 text-xs tracking-widest hover:text-zinc-400 transition-colors border border-dashed border-transparent hover:border-zinc-600 px-3 py-2"
        >
          restaurar
        </button>
        <button
          type="button"
          onClick={handleSaveColors}
          disabled={isPendingColors}
          className="bg-[#5e9e1c] text-white font-display text-base tracking-widest px-8 py-2 hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {isPendingColors ? 'GUARDANDO...' : savedColors ? '✓ APLICADO' : 'APLICAR COLORES'}
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type AdminTab = 'pedidos' | 'productos' | 'gastos' | 'colores'
const TABS: AdminTab[] = ['pedidos', 'productos', 'gastos', 'colores']
const STORAGE_KEY = 'admin_tab'

export default function AdminClient({ initialProducts, initialOrders, initialExpenses, initialColors, initialFonts }: { initialProducts: Product[]; initialOrders: Order[]; initialExpenses: Expense[]; initialColors: SiteColors; initialFonts: SiteFonts }) {
  const [tab, setTab] = useState<AdminTab>('pedidos')
  const [orders, setOrders] = useState(initialOrders)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && TABS.includes(saved as AdminTab)) setTab(saved as AdminTab)
  }, [])

  const handleTab = (t: AdminTab) => {
    setTab(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  const pendingCount = orders.filter(
    (o) => o.status === 'pendiente' || o.status === 'en proceso'
  ).length

  const handleLogout = () => {
    startTransition(async () => { await logout() })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* topbar */}
      <nav className="bg-surface-alt border-b border-dashed border-accent/20 sticky top-0 z-10">
        {/* fila superior: logo + acciones */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="/" className="font-display text-base sm:text-xl text-accent tracking-widest whitespace-nowrap shrink-0 hover:opacity-70 transition-opacity">
            * Hermanas Baking
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <a href="/" className="text-muted/40 text-xs hover:text-accent transition-colors">
              ← sitio
            </a>
            <button
              onClick={handleLogout}
              className="text-muted/40 text-xs hover:text-red-400 transition-colors border border-dashed border-transparent hover:border-red-400/30 px-2 py-1"
            >
              salir
            </button>
          </div>
        </div>

        {/* fila inferior: tabs */}
        <div className="flex border-t border-dashed border-accent/10 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`flex-1 min-w-0 text-[0.6rem] sm:text-xs tracking-widest uppercase px-3 py-2.5 border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-muted hover:text-accent'}`}
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
            <OrdersTab orders={orders} setOrders={setOrders} products={initialProducts} />
          </>
        )}
        {tab === 'gastos' && (
          <>
            <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // gastos · registrá costos y controlá ganancias del mes
            </p>
            <GastosTab expenses={expenses} setExpenses={setExpenses} orders={orders} />
          </>
        )}
        {tab === 'colores' && (
          <>
            <p className="text-muted text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // colores · personalizá la paleta del sitio
            </p>
            <ColorsTab initialColors={initialColors} initialFonts={initialFonts} />
          </>
        )}
      </div>
    </div>
  )
}
