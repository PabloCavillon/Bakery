'use client'

import { useState, useTransition } from 'react'
import { addExpense, updateExpense, deleteExpense } from '../../actions'
import type { Order, Expense, ExpenseCategory } from '../../lib/data'
import { EXPENSE_CATEGORIES } from '../constants'

export default function GastosTab({ expenses, setExpenses, orders }: { expenses: Expense[]; setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>; orders: Order[] }) {
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
