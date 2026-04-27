'use client'

import type { Order, Expense, SiteColors } from '../../lib/data'
import { STATUS_OPTIONS, STATUS_COLORS } from '../constants'

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

export default function StatsTab({ orders, expenses, colors }: { orders: Order[]; expenses: Expense[]; colors: SiteColors }) {
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

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
    const value = delivered.filter(o => o.createdAt.startsWith(key)).reduce((s, o) => s + o.total, 0)
    return { label, value }
  })

  const prodMap: Record<string, { name: string; qty: number }> = {}
  for (const o of delivered) {
    for (const item of o.items) {
      if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.productName, qty: 0 }
      prodMap[item.productId].qty += item.qty
    }
  }
  const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 7)

  const statusCounts = STATUS_OPTIONS
    .map(s => ({ status: s, count: orders.filter(o => o.status === s).length, cls: STATUS_COLORS[s] }))
    .filter(s => s.count > 0)

  const fmt  = (v: number) => `$${v.toLocaleString('es-AR')}`
  const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`

  return (
    <div className="space-y-6">

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

      <div className="border border-dashed border-zinc-200 bg-white p-4 sm:p-5">
        <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-5">// ingresos por mes</p>
        <BarChart data={last6} color={colors.accent} formatValue={fmtK} />
      </div>

      <div className="border border-dashed border-zinc-200 bg-white p-4 sm:p-6">
        <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-5">// productos más pedidos</p>
        {topProducts.length > 0 ? (
          <HorizontalBars data={topProducts.map(p => ({ label: p.name, value: p.qty }))} color={colors.accent} />
        ) : (
          <p className="text-zinc-400 text-sm text-center py-6">sin pedidos entregados aún</p>
        )}
      </div>

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
