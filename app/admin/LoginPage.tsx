'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../actions'

export default function LoginPage() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await login(pw)
      if (res.ok) {
        router.refresh()
      } else {
        setError(res.error ?? 'Error')
        setPw('')
      }
    })
  }

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-dashed border-accent/30 bg-surface p-6 sm:p-8">
        <p className="font-display text-accent text-2xl sm:text-3xl tracking-widest mb-1">
          * LA COOKERIA
        </p>
        <p className="text-muted text-xs tracking-widest uppercase mb-8">// panel admin</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Contraseña"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            className="bg-surface-alt border border-dashed border-accent/30 text-foreground px-4 py-3 text-sm placeholder:text-muted/40 focus:outline-none focus:border-accent/60 w-full"
          />
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent text-background font-display text-xl tracking-widest py-3 hover:bg-accent-dim transition-colors disabled:opacity-50 w-full"
          >
            {isPending ? 'VERIFICANDO...' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-muted/30 text-[0.6rem] text-center mt-6 tracking-widest">
          acceso restringido · solo personal autorizado
        </p>
      </div>
    </div>
  )
}
