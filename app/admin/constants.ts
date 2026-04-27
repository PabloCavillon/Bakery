import type { Order, ExpenseCategory } from '../lib/data'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ingredientes', 'packaging', 'servicios', 'transporte', 'equipamiento', 'marketing', 'otro',
]

export const STATUS_COLORS: Record<Order['status'], string> = {
  'por confirmar': 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  pendiente:       'bg-yellow-400/20 text-yellow-500 border-yellow-400/30',
  'en proceso':    'bg-blue-400/20 text-blue-400 border-blue-400/30',
  listo:           'bg-green-400/20 text-green-500 border-green-400/30',
  entregado:       'bg-zinc-100 text-zinc-400 border-zinc-200',
  cancelado:       'bg-red-400/20 text-red-400 border-red-400/30',
}

export const STATUS_OPTIONS: Order['status'][] = [
  'por confirmar', 'pendiente', 'en proceso', 'listo', 'entregado', 'cancelado',
]
