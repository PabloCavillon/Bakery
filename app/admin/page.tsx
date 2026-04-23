import { cookies } from 'next/headers'
import { getProducts, getOrders, getExpenses } from '../lib/data'
import AdminClient from './AdminClient'
import LoginPage from './LoginPage'

export const metadata = { title: 'Admin — PAZ BAKERY' }

export default async function AdminPage() {
  const store = await cookies()
  const isAuth = store.get('admin_session')?.value === 'authenticated'

  if (!isAuth) return <LoginPage />

  const [products, orders, expenses] = await Promise.all([
    getProducts(),
    getOrders(),
    getExpenses(),
  ])
  return <AdminClient initialProducts={products} initialOrders={orders} initialExpenses={expenses} />
}
