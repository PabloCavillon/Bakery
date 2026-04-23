'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'
import { getProducts, saveProducts, updateProductImage, getOrders, saveOrders, getExpenses, saveExpenses } from './lib/data'
import type { Product, Order, OrderItem, Expense, ExpenseCategory } from './lib/data'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'pazbakery2024'
const SESSION_VALUE  = 'authenticated'

async function requireAuth() {
  const store = await cookies()
  if (store.get('admin_session')?.value !== SESSION_VALUE) {
    throw new Error('No autorizado')
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: 'Contraseña incorrecta' }
  }
  const store = await cookies()
  store.set('admin_session', SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
  return { ok: true }
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete('admin_session')
  redirect('/admin')
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProduct(data: {
  emoji: string
  name: string
  desc: string
  tag: string
  priceValue: number
}): Promise<{ ok: boolean; error?: string; product?: Product }> {
  await requireAuth()
  const products = await getProducts()
  const rotates = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0']
  const newProduct: Product = {
    id: `coo-${Date.now()}`,
    emoji: data.emoji || '🍪',
    name: data.name,
    desc: data.desc,
    tag: data.tag,
    price: `$${data.priceValue.toLocaleString('es-AR')}`,
    priceValue: data.priceValue,
    rotate: rotates[products.length % rotates.length],
    active: true,
  }
  products.push(newProduct)
  await saveProducts(products)
  revalidatePath('/')
  revalidatePath('/catalogo')
  return { ok: true, product: newProduct }
}

export async function updateProduct(
  id: string,
  data: Partial<Pick<Product, 'name' | 'desc' | 'price' | 'priceValue' | 'tag' | 'emoji' | 'active'>>
): Promise<{ ok: boolean; error?: string }> {
  await requireAuth()
  const products = await getProducts()
  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) return { ok: false, error: 'Producto no encontrado' }
  products[idx] = { ...products[idx], ...data }
  await saveProducts(products)
  revalidatePath('/')
  revalidatePath('/catalogo')
  return { ok: true }
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ ok: boolean; image?: string; error?: string }> {
  await requireAuth()

  const file      = formData.get('image') as File
  const productId = formData.get('productId') as string

  if (!file || file.size === 0) return { ok: false, error: 'No hay imagen' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return { ok: false, error: 'Formato no soportado (jpg, png, webp)' }
  }

  let blob
  try {
    blob = await put(`products/${productId}.${ext}`, file, { access: 'public' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Blob upload error:', msg)
    return { ok: false, error: `Storage: ${msg}` }
  }

  await updateProductImage(productId, blob.url)

  revalidatePath('/')
  revalidatePath('/catalogo')
  return { ok: true, image: blob.url }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function addOrder(order: {
  customerName: string
  phone: string
  items: OrderItem[]
  notes: string
  total: number
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAuth()
  const orders = await getOrders()
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    ...order,
  }
  orders.unshift(newOrder)
  await saveOrders(orders)
  revalidatePath('/admin')
  return { ok: true, id: newOrder.id }
}

export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<{ ok: boolean; error?: string }> {
  await requireAuth()
  const orders = await getOrders()
  const idx = orders.findIndex((o) => o.id === id)
  if (idx === -1) return { ok: false, error: 'Pedido no encontrado' }
  orders[idx].status = status
  await saveOrders(orders)
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteOrder(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAuth()
  const orders = await getOrders()
  await saveOrders(orders.filter((o) => o.id !== id))
  revalidatePath('/admin')
  return { ok: true }
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function addExpense(expense: {
  date: string
  desc: string
  category: ExpenseCategory
  amount: number
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAuth()
  const expenses = await getExpenses()
  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    ...expense,
  }
  expenses.unshift(newExpense)
  await saveExpenses(expenses)
  revalidatePath('/admin')
  return { ok: true, id: newExpense.id }
}

export async function deleteExpense(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAuth()
  const expenses = await getExpenses()
  await saveExpenses(expenses.filter((e) => e.id !== id))
  revalidatePath('/admin')
  return { ok: true }
}
