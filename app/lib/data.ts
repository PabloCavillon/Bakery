import { sql } from './db'

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
  date: string
  desc: string
  category: ExpenseCategory
  amount: number
}

export async function getProducts(): Promise<Product[]> {
  const rows = await sql`SELECT * FROM products ORDER BY created_at ASC`
  return rows.map((r) => ({
    id: r.id,
    emoji: r.emoji,
    name: r.name,
    desc: r.description,
    price: r.price,
    priceValue: Number(r.price_value),
    tag: r.tag,
    rotate: r.rotate,
    active: r.active,
    image: r.image ?? undefined,
  }))
}

export async function saveProducts(products: Product[]): Promise<void> {
  for (const p of products) {
    await sql`
      INSERT INTO products (id, emoji, name, description, price, price_value, tag, rotate, active, image)
      VALUES (${p.id}, ${p.emoji}, ${p.name}, ${p.desc}, ${p.price}, ${p.priceValue}, ${p.tag}, ${p.rotate}, ${p.active}, ${p.image ?? null})
      ON CONFLICT (id) DO UPDATE SET
        emoji        = EXCLUDED.emoji,
        name         = EXCLUDED.name,
        description  = EXCLUDED.description,
        price        = EXCLUDED.price,
        price_value  = EXCLUDED.price_value,
        tag          = EXCLUDED.tag,
        rotate       = EXCLUDED.rotate,
        active       = EXCLUDED.active,
        image        = EXCLUDED.image
    `
  }
}

export async function getOrders(): Promise<Order[]> {
  const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`
  const items  = await sql`SELECT * FROM order_items`

  return orders.map((o) => ({
    id:           o.id,
    createdAt:    new Date(o.created_at).toISOString(),
    customerName: o.customer_name,
    phone:        o.phone,
    notes:        o.notes,
    status:       o.status as Order['status'],
    total:        Number(o.total),
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        productId:   i.product_id,
        productName: i.product_name,
        qty:         Number(i.qty),
        unitPrice:   Number(i.unit_price),
      })),
  }))
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await sql`DELETE FROM order_items`
  await sql`DELETE FROM orders`

  for (const o of orders) {
    await sql`
      INSERT INTO orders (id, created_at, customer_name, phone, notes, status, total)
      VALUES (${o.id}, ${o.createdAt}::timestamptz, ${o.customerName}, ${o.phone}, ${o.notes}, ${o.status}, ${o.total})
    `
    for (const item of o.items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price)
        VALUES (${o.id}, ${item.productId}, ${item.productName}, ${item.qty}, ${item.unitPrice})
      `
    }
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const rows = await sql`SELECT * FROM expenses ORDER BY date DESC`
  return rows.map((r) => ({
    id:       r.id,
    date:     String(r.date).slice(0, 10),
    desc:     r.description,
    category: r.category as ExpenseCategory,
    amount:   Number(r.amount),
  }))
}

export async function updateProductImage(id: string, imageUrl: string): Promise<void> {
  await sql`UPDATE products SET image = ${imageUrl} WHERE id = ${id}`
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await sql`DELETE FROM expenses`

  for (const e of expenses) {
    await sql`
      INSERT INTO expenses (id, date, description, category, amount)
      VALUES (${e.id}, ${e.date}::date, ${e.desc}, ${e.category}, ${e.amount})
    `
  }
}
