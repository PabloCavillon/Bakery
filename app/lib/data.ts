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
  imagePosition?: string
  category?: string
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
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_position text DEFAULT 'center center'`
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT ''`
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
    imagePosition: r.image_position ?? 'center center',
    category: r.category ?? '',
  }))
}

export async function saveProducts(products: Product[]): Promise<void> {
  for (const p of products) {
    await sql`
      INSERT INTO products (id, emoji, name, description, price, price_value, tag, rotate, active, image, image_position, category)
      VALUES (${p.id}, ${p.emoji}, ${p.name}, ${p.desc}, ${p.price}, ${p.priceValue}, ${p.tag}, ${p.rotate}, ${p.active}, ${p.image ?? null}, ${p.imagePosition ?? 'center center'}, ${p.category ?? ''})
      ON CONFLICT (id) DO UPDATE SET
        emoji          = EXCLUDED.emoji,
        name           = EXCLUDED.name,
        description    = EXCLUDED.description,
        price          = EXCLUDED.price,
        price_value    = EXCLUDED.price_value,
        tag            = EXCLUDED.tag,
        rotate         = EXCLUDED.rotate,
        active         = EXCLUDED.active,
        image          = EXCLUDED.image,
        image_position = EXCLUDED.image_position,
        category       = EXCLUDED.category
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

// ─── Site Colors ──────────────────────────────────────────────────────────────

export type SiteColors = {
  bg: string
  surface: string
  surfaceAlt: string
  accent: string
  fg: string
  muted: string
  rose: string
}

const COLOR_DEFAULTS: SiteColors = {
  bg:         '#fafff4',
  surface:    '#f0f9e0',
  surfaceAlt: '#e4f2cc',
  accent:     '#5e9e1c',
  fg:         '#2a1408',
  muted:      '#7a5a40',
  rose:       '#e8527a',
}

export async function getSiteColors(): Promise<SiteColors> {
  try {
    const rows = await sql`SELECT key, value FROM settings WHERE key LIKE 'color_%'`
    const m: Record<string, string> = {}
    for (const r of rows) m[r.key] = r.value
    return {
      bg:         m['color_bg']          ?? COLOR_DEFAULTS.bg,
      surface:    m['color_surface']     ?? COLOR_DEFAULTS.surface,
      surfaceAlt: m['color_surface_alt'] ?? COLOR_DEFAULTS.surfaceAlt,
      accent:     m['color_accent']      ?? COLOR_DEFAULTS.accent,
      fg:         m['color_fg']          ?? COLOR_DEFAULTS.fg,
      muted:      m['color_muted']       ?? COLOR_DEFAULTS.muted,
      rose:       m['color_rose']        ?? COLOR_DEFAULTS.rose,
    }
  } catch {
    return { ...COLOR_DEFAULTS }
  }
}

// ─── Site Fonts ───────────────────────────────────────────────────────────────

export type SiteFonts = {
  display: string
  sans: string
}

const FONT_DEFAULTS: SiteFonts = { display: 'luckiest-guy', sans: 'nunito' }

export async function getSiteFonts(): Promise<SiteFonts> {
  try {
    const rows = await sql`SELECT key, value FROM settings WHERE key IN ('font_display', 'font_sans')`
    const m: Record<string, string> = {}
    for (const r of rows) m[r.key] = r.value
    return {
      display: m['font_display'] ?? FONT_DEFAULTS.display,
      sans:    m['font_sans']    ?? FONT_DEFAULTS.sans,
    }
  } catch {
    return { ...FONT_DEFAULTS }
  }
}

export async function saveSiteFonts(fonts: SiteFonts): Promise<void> {
  for (const [key, value] of Object.entries({ font_display: fonts.display, font_sans: fonts.sans })) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  }
}

export async function saveSiteColors(colors: SiteColors): Promise<void> {
  const entries: Record<string, string> = {
    color_bg:          colors.bg,
    color_surface:     colors.surface,
    color_surface_alt: colors.surfaceAlt,
    color_accent:      colors.accent,
    color_fg:          colors.fg,
    color_muted:       colors.muted,
    color_rose:        colors.rose,
  }
  for (const [key, value] of Object.entries(entries)) {
    await sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `
  }
}
