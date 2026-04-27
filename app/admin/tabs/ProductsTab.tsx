'use client'

import { useState, useTransition, useRef } from 'react'
import { createProduct, updateProduct, uploadProductImage } from '../../actions'
import type { Product } from '../../lib/data'

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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '33.333% 33.333%',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-5 h-5 rounded-full border-2 border-zinc-900 shadow-md bg-black/25" />
        </div>
      </div>

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

// ─── Image Upload ─────────────────────────────────────────────────────────────
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

        <div className="absolute inset-0 bg-zinc-100/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-zinc-900 text-xs tracking-widest font-display">
            {preview ? 'CAMBIAR' : 'SUBIR'}
          </span>
        </div>

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

// ─── New Product Form ─────────────────────────────────────────────────────────
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

// ─── Products Tab ─────────────────────────────────────────────────────────────
export default function ProductsTab({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const existingCategories = [...new Set(items.map(p => (p.category ?? '').trim()).filter(Boolean))].sort()

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-3 shrink-0">
              <input
                className="w-9 bg-transparent text-2xl focus:outline-none"
                value={p.emoji}
                onChange={(e) => handleChange(p.id, 'emoji', e.target.value)}
                title="Emoji"
              />
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

          <ImageUpload
            product={p}
            onUploaded={(img) => handleChange(p.id, 'image', img)}
            imagePosition={p.imagePosition}
            onPositionChange={(pos) => handleChange(p.id, 'imagePosition', pos)}
            imageZoom={p.imageZoom}
            onZoomChange={(z) => handleChange(p.id, 'imageZoom', z)}
          />

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
