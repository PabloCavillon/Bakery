'use client'

import { useState, useTransition } from 'react'
import { updateSiteColors, updateSiteFonts } from '../../actions'
import type { SiteColors, SiteFonts } from '../../lib/data'

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

export default function ColorsTab({ initialColors, initialFonts }: { initialColors: SiteColors; initialFonts: SiteFonts }) {
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
                Paz y Milu
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
              Paz y Milu
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
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <span className="font-display text-[11px] tracking-widest" style={{ color: 'var(--nav-text)' }}>
              Paz y Milu
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[8px] tracking-widest" style={{ color: 'var(--muted)', opacity: 0.6 }}>cookies</span>
              <span className="text-[8px] tracking-widest" style={{ color: 'var(--muted)', opacity: 0.6 }}>pedidos</span>
              <span className="text-[7px] border border-dashed px-2 py-0.5"
                style={{ color: 'var(--btn-bg)', borderColor: 'color-mix(in srgb, var(--btn-bg) 50%, transparent)' }}>→ pedir</span>
            </div>
          </div>
          <div className="px-3 py-1.5 flex gap-3 overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
            {['ARTESANAL', '//', 'COOKIES', '//', 'CÓRDOBA', '//'].map((t, i) => (
              <span key={i} className="font-display text-[7px] tracking-widest whitespace-nowrap"
                style={{ color: t === '//' ? 'var(--rose)' : 'var(--bg)', opacity: t === '//' ? 1 : 0.9 }}>{t}</span>
            ))}
          </div>
          <div className="px-3 py-4 border-b border-dashed border-zinc-200" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="font-display text-[26px] leading-none" style={{ color: 'var(--fg)' }}>HERMANAS</p>
            <p className="font-display text-[26px] leading-none ml-2 mb-2" style={{ color: 'var(--accent)' }}>BAKING</p>
            <p className="text-[7px] tracking-[0.2em] mb-3" style={{ color: 'var(--muted)' }}>COOKIES · TARTAS · TORTAS</p>
            <div className="flex gap-2 items-center">
              <span className="font-display text-[9px] tracking-widest px-3 py-1"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>PEDIR</span>
            </div>
          </div>
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
          <div className="px-3 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--accent)' }}>
            <span className="font-display text-[13px] leading-none" style={{ color: 'var(--bg)' }}>¡ENCARGÁ LAS TUYAS!</span>
            <div className="flex gap-1.5">
              <span className="font-display text-[6px] tracking-widest px-2 py-1"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}>WHATSAPP</span>
              <span className="text-[6px] px-2 py-1"
                style={{ border: '1px solid var(--btn-bg)', color: 'var(--btn-bg)' }}>INSTAGRAM</span>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between border-t border-dashed border-zinc-200"
            style={{ backgroundColor: 'var(--surface-alt)' }}>
            <span className="font-display text-[9px]" style={{ color: 'var(--accent)' }}>
              Paz y Milu
            </span>
            <span className="text-[6px] tracking-[0.15em] uppercase" style={{ color: 'var(--muted)', opacity: 0.5 }}>cookies · córdoba · 2026</span>
          </div>
        </div>
      </div>

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
