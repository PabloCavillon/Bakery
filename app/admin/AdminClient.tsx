'use client'

import { useState, useEffect, useTransition } from 'react'
import { logout } from '../actions'
import type { Product, Order, Expense, SiteColors, SiteFonts, Promo } from '../lib/data'
import ProductsTab from './tabs/ProductsTab'
import OrdersTab from './tabs/OrdersTab'
import GastosTab from './tabs/GastosTab'
import StatsTab from './tabs/StatsTab'
import PromosTab from './tabs/PromosTab'
import ColorsTab from './tabs/ColorsTab'

type AdminTab = 'pedidos' | 'productos' | 'gastos' | 'resumen' | 'promos' | 'colores'
const TABS: AdminTab[] = ['pedidos', 'productos', 'gastos', 'resumen', 'promos', 'colores']
const STORAGE_KEY = 'admin_tab'

export default function AdminClient({
  initialProducts,
  initialOrders,
  initialExpenses,
  initialColors,
  initialFonts,
  initialPromos,
}: {
  initialProducts: Product[]
  initialOrders: Order[]
  initialExpenses: Expense[]
  initialColors: SiteColors
  initialFonts: SiteFonts
  initialPromos: Promo[]
}) {
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
      <nav className="bg-zinc-100 border-b border-dashed border-zinc-200 sticky top-0 z-10">
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
