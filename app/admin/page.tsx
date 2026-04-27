import { cookies } from 'next/headers'
import { getProducts, getOrders, getExpenses, getSiteColors, getSiteFonts, getPromos } from '../lib/data'
import AdminClient from './AdminClient'
import LoginPage from './LoginPage'

export const metadata = { title: 'Admin — Hermanas Baking' }

export default async function AdminPage() {
  const store = await cookies()
  const isAuth = store.get('admin_session')?.value === 'authenticated'

  if (!isAuth) return <LoginPage />

  const [products, orders, expenses, colors, fonts, promos] = await Promise.all([
    getProducts(),
    getOrders(),
    getExpenses(),
    getSiteColors(),
    getSiteFonts(),
    getPromos(),
  ])
  return <AdminClient initialProducts={products} initialOrders={orders} initialExpenses={expenses} initialColors={colors} initialFonts={fonts} initialPromos={promos} />
}
