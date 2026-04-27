'use client'
import { createContext, useContext, useState } from 'react'

type CartCtx = {
  qtys: Record<string, number>
  setQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

const CartContext = createContext<CartCtx>({ qtys: {}, setQtys: () => {} })

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [qtys, setQtys] = useState<Record<string, number>>({})
  return <CartContext.Provider value={{ qtys, setQtys }}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
