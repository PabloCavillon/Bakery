import fs from 'fs/promises'
import path from 'path'

export type Product = {
  id: string
  emoji: string
  name: string
  desc: string
  price: string
  priceValue: number
  tag: string
  rotate: string
  active: boolean
  image?: string
}

export type OrderItem = {
  productId: string
  productName: string
  qty: number
  unitPrice: number
}

export type Order = {
  id: string
  createdAt: string
  customerName: string
  phone: string
  items: OrderItem[]
  notes: string
  status: 'pendiente' | 'en proceso' | 'listo' | 'entregado' | 'cancelado'
  total: number
}

export type ExpenseCategory =
  | 'ingredientes'
  | 'packaging'
  | 'servicios'
  | 'transporte'
  | 'equipamiento'
  | 'marketing'
  | 'otro'

export type Expense = {
  id: string
  date: string        // ISO date string
  desc: string
  category: ExpenseCategory
  amount: number
}

const productsPath  = path.join(process.cwd(), 'data/products.json')
const ordersPath    = path.join(process.cwd(), 'data/orders.json')
const expensesPath  = path.join(process.cwd(), 'data/expenses.json')

export async function getProducts(): Promise<Product[]> {
  const raw = await fs.readFile(productsPath, 'utf-8')
  return JSON.parse(raw)
}

export async function saveProducts(products: Product[]): Promise<void> {
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf-8')
}

export async function getOrders(): Promise<Order[]> {
  const raw = await fs.readFile(ordersPath, 'utf-8')
  return JSON.parse(raw)
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf-8')
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    const raw = await fs.readFile(expensesPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await fs.writeFile(expensesPath, JSON.stringify(expenses, null, 2), 'utf-8')
}
