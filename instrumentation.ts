export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { sql } = await import('./app/lib/db')

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

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `

  const defaultColors: Record<string, string> = {
    color_bg:          '#fafff4',
    color_surface:     '#f0f9e0',
    color_surface_alt: '#e4f2cc',
    color_accent:      '#5e9e1c',
    color_accent_dim:  '#4c8414',
    color_fg:          '#2a1408',
    color_muted:       '#7a5a40',
    color_rose:        '#e8527a',
    color_yellow:      '#f5c842',
  }
  for (const [key, value] of Object.entries(defaultColors)) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM products`

  if (Number(count) === 0) {
    const seed = [
      { id: 'coo-chips',     emoji: '🍪', name: 'COO-CHIPS',     desc: 'Vainilla, manteca noisette, chips de chocolate negro y con leche.',   price: '$4.500', priceValue: 4500, tag: 'CLÁSICA',  rotate: '-rotate-[0.8deg]' },
      { id: 'coo-frambuesa', emoji: '🍓', name: 'COO-FRAMBUESA', desc: 'Pistacho, dulce de frambuesas, frosting y más pistachos.',              price: '$4.500', priceValue: 4500, tag: 'FAVORITA', rotate: 'rotate-[0.6deg]'  },
      { id: 'coo-velvet',    emoji: '❤️', name: 'COO-VELVET',    desc: 'Red velvet, frosting, dulce de frambuesas y frambuesas congeladas.',   price: '$4.500', priceValue: 4500, tag: 'ESPECIAL', rotate: '-rotate-[0.5deg]' },
      { id: 'coo-carrot',    emoji: '🥕', name: 'COO-CARROT',    desc: 'Carrot cake, frosting, canela, naranja y zanahorias en almíbar.',      price: '$4.500', priceValue: 4500, tag: 'SORPRESA', rotate: 'rotate-[1deg]'    },
      { id: 'coo-cacao',     emoji: '🍫', name: 'COO-CACAO',     desc: 'Chocolate rellena de chocolate y chips de chocolate semi.',            price: '$4.500', priceValue: 4500, tag: 'INTENSA',  rotate: '-rotate-[0.7deg]' },
      { id: 'coo-lemon',     emoji: '🍋', name: 'COO-LEMON',     desc: 'Vainilla, rellena de curd de limón y merengue.',                      price: '$4.500', priceValue: 4500, tag: 'FRESCA',   rotate: 'rotate-[0.4deg]'  },
    ]
    for (const p of seed) {
      await sql`
        INSERT INTO products (id, emoji, name, description, price, price_value, tag, rotate, active)
        VALUES (${p.id}, ${p.emoji}, ${p.name}, ${p.desc}, ${p.price}, ${p.priceValue}, ${p.tag}, ${p.rotate}, true)
      `
    }
  }
}
