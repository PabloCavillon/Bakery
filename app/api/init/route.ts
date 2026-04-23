import { NextResponse } from 'next/server'
import { sql } from '../../lib/db'

const SEED_PRODUCTS = [
  { id: 'coo-chips',     emoji: '🍪', name: 'COO-CHIPS',     desc: 'Vainilla, manteca noisette, chips de chocolate negro y con leche.',            price: '$4.500', priceValue: 4500, tag: 'CLÁSICA',  rotate: '-rotate-[0.8deg]', image: '/products/coo-chips.jpeg'     },
  { id: 'coo-frambuesa', emoji: '🍓', name: 'COO-FRAMBUESA', desc: 'Pistacho, dulce de frambuesas, frosting y más pistachos.',                      price: '$4.500', priceValue: 4500, tag: 'FAVORITA', rotate: 'rotate-[0.6deg]',  image: '/products/coo-frambuesa.jpeg' },
  { id: 'coo-velvet',    emoji: '❤️', name: 'COO-VELVET',    desc: 'Red velvet, frosting, dulce de frambuesas y frambuesas congeladas.',            price: '$4.500', priceValue: 4500, tag: 'ESPECIAL', rotate: '-rotate-[0.5deg]', image: '/products/coo-velvet.jpeg'    },
  { id: 'coo-carrot',    emoji: '🥕', name: 'COO-CARROT',    desc: 'Carrot cake, frosting, canela, naranja y zanahorias en almíbar.',               price: '$4.500', priceValue: 4500, tag: 'SORPRESA', rotate: 'rotate-[1deg]',    image: '/products/coo-carrot.jpeg'    },
  { id: 'coo-cacao',     emoji: '🍫', name: 'COO-CACAO',     desc: 'Chocolate rellena de chocolate y chips de chocolate semi.',                     price: '$4.500', priceValue: 4500, tag: 'INTENSA',  rotate: '-rotate-[0.7deg]', image: '/products/coo-cacao.jpeg'     },
  { id: 'coo-lemon',     emoji: '🍋', name: 'COO-LEMON',     desc: 'Vainilla, rellena de curd de limón y merengue.',                               price: '$4.500', priceValue: 4500, tag: 'FRESCA',   rotate: 'rotate-[0.4deg]',  image: '/products/coo-lemon.jpeg'     },
]

export async function GET() {
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      emoji       TEXT        NOT NULL DEFAULT '🍪',
      name        TEXT        NOT NULL,
      description TEXT        NOT NULL DEFAULT '',
      price       TEXT        NOT NULL,
      price_value NUMERIC     NOT NULL DEFAULT 0,
      tag         TEXT        NOT NULL DEFAULT '',
      rotate      TEXT        NOT NULL DEFAULT 'rotate-0',
      active      BOOLEAN     NOT NULL DEFAULT true,
      image       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      customer_name TEXT        NOT NULL,
      phone         TEXT        NOT NULL,
      notes         TEXT        NOT NULL DEFAULT '',
      status        TEXT        NOT NULL DEFAULT 'pendiente',
      total         NUMERIC     NOT NULL DEFAULT 0
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id           SERIAL  PRIMARY KEY,
      order_id     TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id   TEXT    NOT NULL,
      product_name TEXT    NOT NULL,
      qty          INTEGER NOT NULL,
      unit_price   NUMERIC NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT    PRIMARY KEY,
      date        DATE    NOT NULL,
      description TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      amount      NUMERIC NOT NULL
    )
  `

  // Seed products only if table is empty
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM products`

  if (Number(count) === 0) {
    for (const p of SEED_PRODUCTS) {
      await sql`
        INSERT INTO products (id, emoji, name, description, price, price_value, tag, rotate, active)
        VALUES (${p.id}, ${p.emoji}, ${p.name}, ${p.desc}, ${p.price}, ${p.priceValue}, ${p.tag}, ${p.rotate}, true)
      `
    }
  }

  return NextResponse.json({ ok: true, message: 'Base de datos lista' })
}
