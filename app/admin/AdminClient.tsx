'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createProduct, updateProduct, uploadProductImage, addOrder, updateOrder, updateOrderStatus, deleteOrder, addExpense, updateExpense, deleteExpense, updateSiteColors, updateSiteFonts, updatePromos, logout } from '../actions'
import type { Product, Order, OrderItem, Expense, ExpenseCategory, SiteColors, SiteFonts, Promo, PromoConditionItem } from '../lib/data'
import { calcTotal } from '../lib/promo'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ingredientes', 'packaging', 'servicios', 'transporte', 'equipamiento', 'marketing', 'otro',
]

const STATUS_COLORS: Record<Order['status'], string> = {
  'por confirmar': 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  pendiente:       'bg-yellow-400/20 text-yellow-500 border-yellow-400/30',
  'en proceso':    'bg-blue-400/20 text-blue-400 border-blue-400/30',
  listo:           'bg-green-400/20 text-green-500 border-green-400/30',
  entregado:       'bg-zinc-100 text-zinc-400 border-zinc-200',
  cancelado:       'bg-red-400/20 text-red-400 border-red-400/30',
}
const STATUS_OPTIONS: Order['status'][] = ['por confirmar', 'pendiente', 'en proceso', 'listo', 'entregado', 'cancelado']

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
      <p className="text-zinc-500 text-[0.55rem] tracking-widest uppercase mb-1.5">
        encuadre — arrastrá · scroll o slider para zoom
      </p>
      <div
        ref={ref}
        className="relative w-full aspect-video overflow-hidden cursor-crosshair select-none border border-dashed border-zinc-200"
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
          <div className="w-5 h-5 rounded-full border-2 border-zinc-900 shadow-md bg-black/25" />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom - 0.1))}
          className="text-zinc-500 hover:text-zinc-900 transition-colors text-base leading-none px-2 py-0.5 rounded hover:bg-zinc-100 select-none"
        >−</button>
        <input
          type="range"
          min={1} max={3} step={0.05}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="flex-1 accent-white"
        />
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom + 0.1))}
          className="text-zinc-500 hover:text-zinc-900 transition-colors text-base leading-none px-2 py-0.5 rounded hover:bg-zinc-100 select-none"
        >+</button>
        <span className="text-[0.6rem] text-zinc-600 w-8 text-right tabular-nums">{zoom.toFixed(1)}×</span>
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
      <p className="text-zinc-500 text-[0.6rem] tracking-widest uppercase mb-1.5">Imagen del producto</p>
      <div
        className="relative aspect-video border-2 border-dashed border-zinc-200 overflow-hidden cursor-pointer hover:border-zinc-400 transition-colors group"
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
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-zinc-100">
            <span className="text-3xl select-none opacity-40">{product.emoji}</span>
            <span className="text-zinc-600 text-[0.6rem] tracking-widest">TAP PARA SUBIR</span>
          </div>
        )}

        {/* hover overlay */}
        <div className="absolute inset-0 bg-zinc-100/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-zinc-900 text-xs tracking-widest font-display">
            {preview ? 'CAMBIAR' : 'SUBIR'}
          </span>
        </div>

        {/* uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-zinc-900 text-xs tracking-widest animate-pulse">SUBIENDO...</span>
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
function NewProductForm({ onCreated, categories }: { onCreated: (p: Product) => void; categories: string[] }) {
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
        className="w-full border border-dashed border-zinc-300 text-zinc-900 font-display text-base tracking-widest px-4 py-3 hover:bg-zinc-900/5 transition-colors flex items-center justify-center gap-2"
      >
        {open ? '✕ CANCELAR' : '+ NUEVO PRODUCTO'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border border-dashed border-zinc-200 border-t-0 bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="flex gap-2">
              <input
                className="w-12 bg-zinc-100 border border-dashed border-zinc-200 text-2xl text-center focus:outline-none focus:border-zinc-500 py-2"
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                title="Emoji"
              />
              <input
                className="flex-1 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500"
                placeholder="Nombre del producto"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <input
              className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-900/50"
              placeholder="Tag (ej: NUEVO, CLÁSICO)"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            />
          </div>

          <div className="mb-3">
            <input
              list="newprod-cat-list"
              className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-400 text-xs tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              placeholder="Categoría (ej: Cookies, Tartas, Tortas)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <datalist id="newprod-cat-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            {form.category.trim() && !categories.includes(form.category.trim()) && (
              <p className="text-amber-500 text-[0.6rem] mt-1">⚠ categoría nueva &ldquo;{form.category.trim()}&rdquo; — confirmá que está bien escrita</p>
            )}
          </div>

          <textarea
            rows={2}
            className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none mb-3 placeholder:text-zinc-600"
            placeholder="Descripción del producto"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-zinc-400 text-xs shrink-0">Precio $</label>
              <input
                type="number"
                min={1}
                className="w-32 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg px-3 py-1.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-900/50"
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
                className="bg-zinc-900 text-white font-display text-base tracking-widest px-6 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
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
  const [search, setSearch] = useState('')

  const existingCategories = [...new Set(items.map(p => (p.category ?? '').trim()).filter(Boolean))].sort()

  const [saving, setSaving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const filtered = search.trim()
    ? items.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : items

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
      <NewProductForm onCreated={(p) => setItems((prev) => [...prev, p])} categories={existingCategories} />
      <datalist id="prod-cat-list">
        {existingCategories.map(c => <option key={c} value={c} />)}
      </datalist>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto por nombre o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-400"
        />
      </div>
      {filtered.length === 0 && search.trim() && (
        <p className="text-zinc-400 text-sm text-center py-8 tracking-widest">// sin resultados para &ldquo;{search}&rdquo;</p>
      )}
      {filtered.map((p) => (
        <div
          key={p.id}
          className={`border border-dashed border-zinc-200 bg-white p-4 sm:p-5 transition-all hover:border-zinc-300 hover:shadow-sm ${!p.active ? 'opacity-50' : ''}`}
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
                className={`w-10 h-5 rounded-full border border-dashed transition-colors flex items-center px-0.5 shrink-0 ${p.active ? 'bg-white/10 border-zinc-900/20' : 'bg-zinc-100 border-zinc-200'}`}
                title={p.active ? 'Ocultar producto' : 'Mostrar producto'}
              >
                <div className={`w-4 h-4 rounded-full transition-transform ${p.active ? 'bg-white translate-x-5' : 'bg-zinc-300'}`} />
              </button>
              <span className="text-zinc-500 text-[0.6rem]">{p.active ? 'visible' : 'oculto'}</span>
            </div>
            <input
              className="flex-1 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg sm:text-xl tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-500 min-w-0"
              value={p.name}
              onChange={(e) => handleChange(p.id, 'name', e.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full sm:w-28 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-zinc-500"
              value={p.tag}
              onChange={(e) => handleChange(p.id, 'tag', e.target.value)}
              placeholder="Tag"
            />
          </div>

          {/* row 2: category */}
          <div className="mb-3">
            <input
              list="prod-cat-list"
              className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-400 text-xs tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              placeholder="Categoría (ej: Cookies, Tartas, Tortas)"
              value={p.category ?? ''}
              onChange={(e) => handleChange(p.id, 'category', e.target.value)}
            />
            {(p.category ?? '').trim() && !existingCategories.includes((p.category ?? '').trim()) && (
              <p className="text-amber-500 text-[0.6rem] mt-1">⚠ categoría nueva &ldquo;{(p.category ?? '').trim()}&rdquo; — confirmá que está bien escrita</p>
            )}
          </div>

          <textarea
            rows={2}
            className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none mb-3"
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mt-4 pt-4 border-t border-dashed border-zinc-200">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-zinc-400 text-xs shrink-0">Precio $</label>
              <input
                type="number"
                min={0}
                className="w-28 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg px-3 py-1.5 focus:outline-none focus:border-zinc-500"
                value={p.priceValue}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  handleChange(p.id, 'priceValue', v)
                  handleChange(p.id, 'price', `$${v.toLocaleString('es-AR')}`)
                }}
              />
              <span className="text-zinc-600 text-xs">→ se muestra: {p.price}</span>
            </div>
            <div className="flex items-center gap-3">
              {feedback[p.id] && <span className="text-xs text-green-400">{feedback[p.id]}</span>}
              <button
                onClick={() => handleSave(p.id)}
                disabled={saving === p.id}
                className="bg-zinc-900 text-white font-display text-base tracking-widest px-6 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
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
function OrdersTab({ orders, setOrders, products, promos }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; products: Product[]; promos: Promo[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editOrderForm, setEditOrderForm] = useState<{ customerName: string; phone: string; notes: string; qtys: Record<string, number> } | null>(null)
  const [filterName, setFilterName] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const activeProducts = products.filter((p) => p.active)

  const editItems = editOrderForm
    ? activeProducts
        .filter((p) => (editOrderForm.qtys[p.id] ?? 0) > 0)
        .map((p) => ({ productId: p.id, productName: p.name, qty: editOrderForm.qtys[p.id], unitPrice: p.priceValue }))
    : []
  const editQtys         = editOrderForm?.qtys ?? {}
  const editTotal        = calcTotal(editQtys, activeProducts, promos)
  const editUnitTotal    = editItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const editPromoApplied = editTotal < editUnitTotal

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
    setEditOrderForm({ customerName: o.customerName, phone: o.phone, notes: o.notes, qtys })
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-zinc-400 text-sm">Total: </span>
                      <span className="font-display text-2xl text-zinc-900">${editTotal.toLocaleString('es-AR')}</span>
                      {editPromoApplied && <span className="text-xs text-green-400 ml-2">promo x4 cookies aplicada</span>}
                    </div>
                    <div className="flex items-center gap-3">
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

// ─── Gastos Tab ───────────────────────────────────────────────────────────────
function GastosTab({ expenses, setExpenses, orders }: { expenses: Expense[]; setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>; orders: Order[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ date: string; desc: string; category: ExpenseCategory; amount: string }>({ date: '', desc: '', category: 'ingredientes', amount: '' })

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

  const handleSaveExpense = (id: string) => {
    const amount = Number(editForm.amount)
    if (!editForm.desc || !amount || amount <= 0) return
    startTransition(async () => {
      const res = await updateExpense(id, { date: editForm.date, desc: editForm.desc, category: editForm.category, amount })
      if (res.ok) {
        setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, date: editForm.date, desc: editForm.desc, category: editForm.category, amount } : e))
        setEditingId(null)
      }
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
          { label: 'GANANCIA', value: monthGanancia, color: monthGanancia >= 0 ? 'text-zinc-900' : 'text-red-400' },
        ].map((card) => (
          <div key={card.label} className="border border-dashed border-zinc-200 bg-white p-3 sm:p-4 text-center">
            <p className="text-zinc-500 text-[0.5rem] sm:text-[0.6rem] tracking-[0.3em] uppercase mb-1">{card.label}</p>
            <p className={`font-display text-xl sm:text-2xl leading-none ${card.color}`}>
              ${card.value.toLocaleString('es-AR')}
            </p>
          </div>
        ))}
      </div>

      <p className="text-zinc-600 text-[0.55rem] tracking-widest uppercase text-center mb-6">
        // mes actual · totales históricos: ingresos ${totalIngresos.toLocaleString('es-AR')} · gastos ${totalGastos.toLocaleString('es-AR')} · ganancia ${totalGanancia.toLocaleString('es-AR')}
      </p>

      {/* Add expense form */}
      <form onSubmit={handleAdd} className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5 mb-6">
        <p className="text-zinc-400 text-[0.6rem] tracking-[0.3em] uppercase mb-4">// registrar gasto</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 w-full"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 w-full cursor-pointer"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-white">{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            className="sm:col-span-2 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-3 py-2.5 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 w-full"
            placeholder="Descripción (ej: harina x5kg)"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-lg px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-900/50 w-full"
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
              className="bg-zinc-900 text-white font-display text-base tracking-widest px-6 py-2 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? 'GUARDANDO...' : '+ AGREGAR GASTO'}
            </button>
          </div>
        </div>
      </form>

      {/* Expense list */}
      {sorted.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-12 tracking-widest">// sin gastos registrados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((exp) => (
            <div key={exp.id} className="border border-dashed border-zinc-200 bg-white p-3 sm:p-4 transition-all hover:border-zinc-300 hover:shadow-sm">
              {editingId === exp.id ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="date" value={editForm.date}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-2 py-1.5 focus:outline-none focus:border-zinc-500 w-full"
                    />
                    <select value={editForm.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                      className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-2 py-1.5 focus:outline-none focus:border-zinc-500 w-full cursor-pointer"
                    >
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="bg-white">{c}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <input
                      className="col-span-2 bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 text-sm px-2 py-1.5 focus:outline-none focus:border-zinc-500 w-full"
                      placeholder="Descripción"
                      value={editForm.desc}
                      onChange={(e) => setEditForm((f) => ({ ...f, desc: e.target.value }))}
                    />
                    <input type="number" min={1}
                      className="bg-zinc-100 border border-dashed border-zinc-200 text-zinc-900 font-display text-base px-2 py-1.5 focus:outline-none focus:border-zinc-500 w-full"
                      placeholder="Monto"
                      value={editForm.amount}
                      onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingId(null)}
                      className="text-zinc-400 text-xs tracking-widest hover:text-zinc-700 transition-colors rounded hover:bg-zinc-100 px-3 py-1.5"
                    >cancelar</button>
                    <button type="button" onClick={() => handleSaveExpense(exp.id)} disabled={isPending}
                      className="bg-zinc-900 text-white font-display text-base tracking-widest px-4 py-1.5 hover:bg-zinc-700 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >{isPending ? '...' : 'GUARDAR'}</button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[0.55rem] tracking-widest uppercase bg-zinc-900/5 text-zinc-900 border border-dashed border-zinc-200 px-1.5 py-0.5 leading-none shrink-0">
                        {exp.category}
                      </span>
                      <span className="text-zinc-600 text-[0.6rem]">
                        {new Date(exp.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-sm truncate">{exp.desc}</p>
                  </div>
                  <p className="font-display text-xl text-red-400 shrink-0">${exp.amount.toLocaleString('es-AR')}</p>
                  <button
                    onClick={() => { setEditingId(exp.id); setEditForm({ date: exp.date, desc: exp.desc, category: exp.category, amount: String(exp.amount) }) }}
                    className="text-zinc-600 hover:text-zinc-900 transition-colors text-xs px-2 py-1.5 rounded hover:bg-zinc-100 border border-dashed border-transparent hover:border-zinc-300 shrink-0"
                    title="Editar gasto"
                  >✎</button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-2 py-1.5 rounded hover:bg-red-50 border border-dashed border-transparent hover:border-red-200 shrink-0"
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chart helpers ────────────────────────────────────────────────────────────
function BarChart({ data, color, formatValue, labelEvery = 1 }: {
  data: { label: string; value: number }[]
  color: string
  formatValue?: (v: number) => string
  labelEvery?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const H = 160
  return (
    <div className="flex items-end gap-1 sm:gap-1.5">
      {data.map((d, i) => {
        const barH = Math.round((d.value / max) * H)
        const showLabel = i % labelEvery === 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[0.6rem] sm:text-xs text-zinc-500 tabular-nums leading-none text-center" style={{ minHeight: 16 }}>
              {d.value > 0 ? (formatValue ? formatValue(d.value) : String(d.value)) : ''}
            </span>
            <div className="w-full flex items-end" style={{ height: H }}>
              <div
                className="w-full"
                style={{ height: barH > 0 ? barH : 1, backgroundColor: barH > 0 ? color : 'transparent', opacity: barH > 0 ? 1 : 0 }}
              />
            </div>
            <span className="text-[0.6rem] sm:text-xs text-zinc-400 truncate w-full text-center leading-tight" style={{ minHeight: 14 }}>
              {showLabel ? d.label : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBars({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3 sm:space-y-4">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-zinc-700 shrink-0 w-32 sm:w-44 truncate">{d.label}</span>
          <div className="flex-1 bg-zinc-100 h-4 overflow-hidden">
            <div style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }} className="h-full transition-all duration-500" />
          </div>
          <span className="text-sm text-zinc-600 w-7 text-right shrink-0 tabular-nums font-medium">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ orders, expenses, colors }: { orders: Order[]; expenses: Expense[]; colors: SiteColors }) {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const delivered      = orders.filter(o => o.status === 'entregado')
  const monthDelivered = delivered.filter(o => o.createdAt.startsWith(thisMonth))
  const monthExpenses  = expenses.filter(e => e.date.startsWith(thisMonth))

  const monthIngresos  = monthDelivered.reduce((s, o) => s + o.total, 0)
  const monthGastos    = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const monthGanancia  = monthIngresos - monthGastos
  const totalIngresos  = delivered.reduce((s, o) => s + o.total, 0)
  const avgTicket      = delivered.length > 0 ? Math.round(totalIngresos / delivered.length) : 0

  // Ingresos por mes (últimos 6)
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
    const value = delivered.filter(o => o.createdAt.startsWith(key)).reduce((s, o) => s + o.total, 0)
    return { label, value }
  })

  // Top productos
  const prodMap: Record<string, { name: string; qty: number }> = {}
  for (const o of delivered) {
    for (const item of o.items) {
      if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.productName, qty: 0 }
      prodMap[item.productId].qty += item.qty
    }
  }
  const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 7)

  // Pedidos por estado
  const statusCounts = STATUS_OPTIONS
    .map(s => ({ status: s, count: orders.filter(o => o.status === s).length, cls: STATUS_COLORS[s] }))
    .filter(s => s.count > 0)

  const fmt  = (v: number) => `$${v.toLocaleString('es-AR')}`
  const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'INGRESOS MES',  value: fmt(monthIngresos), sub: `${monthDelivered.length} pedido${monthDelivered.length !== 1 ? 's' : ''}`, color: 'text-green-600' },
          { label: 'GASTOS MES',    value: fmt(monthGastos),   sub: 'registrados',                                                               color: 'text-red-500'  },
          { label: 'GANANCIA MES',  value: fmt(monthGanancia), sub: '',                                                                           color: monthGanancia >= 0 ? 'text-zinc-900' : 'text-red-500' },
          { label: 'TICKET PROM.',  value: fmt(avgTicket),     sub: `${delivered.length} pedido${delivered.length !== 1 ? 's' : ''} históricos`,  color: 'text-zinc-700' },
        ].map(card => (
          <div key={card.label} className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5">
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.25em] uppercase mb-2">{card.label}</p>
            <p className={`font-display text-2xl sm:text-3xl leading-none ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-zinc-400 text-xs mt-1.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Ingresos por mes */}
      <div className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5">
        <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-5">// ingresos por mes</p>
        <BarChart data={last6} color={colors.accent} formatValue={fmtK} />
      </div>

      {/* Top productos */}
      <div className="border border-dashed border-zinc-200 bg-white p-4 sm:p-6">
        <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-5">// productos más pedidos</p>
        {topProducts.length > 0 ? (
          <HorizontalBars data={topProducts.map(p => ({ label: p.name, value: p.qty }))} color={colors.accent} />
        ) : (
          <p className="text-zinc-400 text-sm text-center py-6">sin pedidos entregados aún</p>
        )}
      </div>

      {/* Estado de pedidos */}
      <div className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5">
        <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-4">// pedidos por estado</p>
        <div className="flex flex-wrap gap-2">
          {statusCounts.map(({ status, count, cls }) => (
            <div key={status} className={`border border-dashed px-3 py-2 text-sm tracking-wide ${cls}`}>
              {status} · <span className="font-bold">{count}</span>
            </div>
          ))}
          {statusCounts.length === 0 && <p className="text-zinc-400 text-sm">// sin pedidos</p>}
        </div>
      </div>

    </div>
  )
}

// ─── Promos Tab ───────────────────────────────────────────────────────────────
function PromosTab({ initialPromos, products }: { initialPromos: Promo[]; products: Product[] }) {
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
          {/* Header: emoji + toggle + name */}
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

          {/* Desc */}
          <input
            className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:border-zinc-500 mb-3 placeholder:text-zinc-500"
            value={promo.desc}
            onChange={e => set(promo.id, { desc: e.target.value })}
            placeholder="Descripción visible en el catálogo (ej: 4 cookies por $16.000, ahorrás $2.000)"
          />

          {/* Conditions */}
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

          {/* Bundle price + delete */}
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
    <div className="border border-dashed border-zinc-200 bg-white p-3 flex items-center gap-3">
      <div className="relative shrink-0">
        <div className="w-9 h-9 border border-zinc-300 cursor-pointer" style={{ background: colors[k] }}
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
          className="w-full bg-zinc-100 border border-dashed border-zinc-200 text-zinc-600 text-xs px-2 py-1 focus:outline-none focus:border-zinc-500 font-mono tracking-widest" />
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
              className={`border border-dashed p-3 text-left transition-colors ${fonts.display === f.id ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-zinc-100 hover:border-zinc-500'}`}
            >
              <p style={{ fontFamily: `var(${f.var})` }} className="text-zinc-800 text-xl leading-none mb-2 truncate">
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
              className={`border border-dashed p-3 text-left transition-colors ${fonts.sans === f.id ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-zinc-100 hover:border-zinc-500'}`}
            >
              <p style={{ fontFamily: `var(${f.var})` }} className="text-zinc-800 text-sm leading-snug mb-2">
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

      <div className="border-t border-dashed border-zinc-200 mb-6" />

      {/* ── Navegación ── */}
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// navegación</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
          <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <span className="font-display text-base tracking-widest" style={{ color: 'var(--nav-text)' }}>
              Hermanas Baking
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
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// cards de productos</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
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
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// botones</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
          <div className="p-6 flex flex-wrap items-end gap-6" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-center">
              <div className="font-display text-xl tracking-widest px-8 py-3"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>
                PEDIR
              </div>
              <p className="text-zinc-600 text-[0.5rem] tracking-widest mt-1.5">relleno</p>
            </div>
            <div className="text-center">
              <div className="font-display text-xl tracking-widest px-8 py-3 border-2"
                style={{ borderColor: 'var(--btn-bg)', color: 'var(--btn-bg)' }}>
                INSTAGRAM
              </div>
              <p className="text-zinc-600 text-[0.5rem] tracking-widest mt-1.5">outline</p>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase border border-dashed px-4 py-2"
                style={{ color: 'var(--btn-bg)', borderColor: 'color-mix(in srgb, var(--btn-bg) 50%, transparent)' }}>
                → pedir
              </div>
              <p className="text-zinc-600 text-[0.5rem] tracking-widest mt-1.5">nav</p>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picker('botones', 'btnBg', 'Fondo del botón')}
          {picker('botones', 'btnText', 'Texto del botón')}
        </div>
      </div>

      {/* ── Fondos ── */}
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// fondos y superficies</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
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
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// texto</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
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
      <div className="mb-5 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// acentos de marca</p>
        </div>
        <div style={pv} className="font-sans border-b border-dashed border-zinc-200">
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
      <div className="mb-6 border border-dashed border-zinc-300 overflow-hidden">
        <div className="bg-zinc-100 px-4 py-2 border-b border-dashed border-zinc-300">
          <p className="text-zinc-600 text-[0.55rem] tracking-[0.3em] uppercase">// vista completa</p>
        </div>
        <div style={pv} className="font-sans overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <span className="font-display text-[11px] tracking-widest" style={{ color: 'var(--nav-text)' }}>
              Hermanas Baking
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
          <div className="px-3 py-4 border-b border-dashed border-zinc-200" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="font-display text-[26px] leading-none" style={{ color: 'var(--fg)' }}>HERMANAS</p>
            <p className="font-display text-[26px] leading-none ml-2 mb-2" style={{ color: 'var(--accent)' }}>BAKING</p>
            <p className="text-[7px] tracking-[0.2em] mb-3" style={{ color: 'var(--muted)' }}>COOKIES · TARTAS · TORTAS</p>
            <div className="flex gap-2 items-center">
              <span className="font-display text-[9px] tracking-widest px-3 py-1"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>PEDIR</span>
            </div>
          </div>
          {/* Cards */}
          <div className="px-3 py-3 border-b border-dashed border-zinc-200" style={{ backgroundColor: 'var(--bg)' }}>
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
          <div className="px-3 py-2 flex items-center justify-between border-t border-dashed border-zinc-200"
            style={{ backgroundColor: 'var(--surface-alt)' }}>
            <span className="font-display text-[9px]" style={{ color: 'var(--accent)' }}>
              Hermanas Baking
            </span>
            <span className="text-[6px] tracking-[0.15em] uppercase" style={{ color: 'var(--muted)', opacity: 0.5 }}>cookies · córdoba · 2026</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-zinc-200">
        <button
          type="button"
          onClick={handleReset}
          className="text-zinc-400 text-xs tracking-widest hover:text-zinc-700 transition-colors rounded hover:bg-zinc-100 px-3 py-2"
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
type AdminTab = 'pedidos' | 'productos' | 'gastos' | 'resumen' | 'promos' | 'colores'
const TABS: AdminTab[] = ['pedidos', 'productos', 'gastos', 'resumen', 'promos', 'colores']
const STORAGE_KEY = 'admin_tab'

export default function AdminClient({ initialProducts, initialOrders, initialExpenses, initialColors, initialFonts, initialPromos }: { initialProducts: Product[]; initialOrders: Order[]; initialExpenses: Expense[]; initialColors: SiteColors; initialFonts: SiteFonts; initialPromos: Promo[] }) {
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
    (o) => o.status === 'por confirmar' || o.status === 'pendiente' || o.status === 'en proceso'
  ).length

  const handleLogout = () => {
    startTransition(async () => { await logout() })
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* topbar */}
      <nav className="bg-zinc-100 border-b border-dashed border-zinc-200 sticky top-0 z-10">
        {/* fila superior: logo + acciones */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="/" className="font-display text-base sm:text-xl text-zinc-900 tracking-widest whitespace-nowrap shrink-0 hover:opacity-70 transition-opacity">
            Hermanas Baking
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <a href="/" className="text-zinc-400 text-xs hover:text-zinc-900 transition-colors rounded hover:bg-zinc-100 px-2 py-1">
              ← sitio
            </a>
            <button
              onClick={handleLogout}
              className="text-zinc-400 text-xs hover:text-red-500 transition-colors rounded hover:bg-red-50 px-2 py-1"
            >
              salir
            </button>
          </div>
        </div>

        {/* fila inferior: tabs */}
        <div className="flex border-t border-dashed border-zinc-200 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`flex-1 min-w-0 text-[0.6rem] sm:text-xs tracking-widest uppercase px-3 py-2.5 border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-zinc-900 text-zinc-900 bg-zinc-900/5' : 'border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
            >
              {t}
              {t === 'pedidos' && pendingCount > 0 && (
                <span className="ml-1 bg-white text-zinc-900 text-[0.5rem] px-1 py-0.5 font-bold leading-none">
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
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // productos · editá precio, descripción, imagen y visibilidad
            </p>
            <ProductsTab products={initialProducts} />
          </>
        )}
        {tab === 'pedidos' && (
          <>
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // pedidos · cargá nuevos y actualizá el estado
            </p>
            <OrdersTab orders={orders} setOrders={setOrders} products={initialProducts} promos={initialPromos} />
          </>
        )}
        {tab === 'gastos' && (
          <>
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // gastos · registrá costos y controlá ganancias del mes
            </p>
            <GastosTab expenses={expenses} setExpenses={setExpenses} orders={orders} />
          </>
        )}
        {tab === 'resumen' && (
          <>
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // resumen · indicadores de ventas y productos
            </p>
            <StatsTab orders={orders} expenses={expenses} colors={initialColors} />
          </>
        )}
        {tab === 'promos' && (
          <>
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // promos · configurá descuentos por cantidad, producto o categoría
            </p>
            <PromosTab initialPromos={initialPromos} products={initialProducts} />
          </>
        )}
        {tab === 'colores' && (
          <>
            <p className="text-zinc-400 text-[0.6rem] tracking-[0.4em] uppercase mb-5">
              // colores · personalizá la paleta del sitio
            </p>
            <ColorsTab initialColors={initialColors} initialFonts={initialFonts} />
          </>
        )}
      </div>
    </div>
  )
}
