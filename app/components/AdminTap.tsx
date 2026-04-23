'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminTap({ children, className }: { children: React.ReactNode; className?: string }) {
  const taps = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const handleClick = () => {
    taps.current += 1
    if (timer.current) clearTimeout(timer.current)

    if (taps.current >= 5) {
      taps.current = 0
      router.push('/admin')
      return
    }

    timer.current = setTimeout(() => { taps.current = 0 }, 1500)
  }

  return (
    <span className={className} onClick={handleClick} style={{ cursor: 'default' }}>
      {children}
    </span>
  )
}
