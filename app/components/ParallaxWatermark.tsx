'use client'

import { useEffect, useRef } from 'react'

export default function ParallaxWatermark() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf: number

    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        if (el) el.style.transform = `rotate(-12deg) translateY(${window.scrollY * 0.25}px)`
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
    >
      <span
        ref={ref}
        className="font-display text-[40vw] leading-none text-accent/5"
        style={{ transform: 'rotate(-12deg)', willChange: 'transform' }}
      >
        COOKIES
      </span>
    </div>
  )
}
