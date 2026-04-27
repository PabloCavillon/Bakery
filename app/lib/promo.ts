import type { Product, Promo } from './data'

export type PromoApplication = {
  promo: Promo
  times: number
  savings: number
}

export type CalcBreakdown = {
  total: number
  applications: PromoApplication[]
}

export function calcBreakdown(
  qtys: Record<string, number>,
  products: Product[],
  promos: Promo[]
): CalcBreakdown {
  const remaining: Record<string, number> = {}
  for (const [id, qty] of Object.entries(qtys)) {
    if ((qty ?? 0) > 0) remaining[id] = qty
  }

  const catMap: Record<string, string[]> = {}
  for (const p of products) {
    const cat = (p.category ?? '').toLowerCase().trim()
    if (!catMap[cat]) catMap[cat] = []
    catMap[cat].push(p.id)
  }

  const unitPrice: Record<string, number> = {}
  for (const p of products) unitPrice[p.id] = p.priceValue

  let total = 0
  const applications: PromoApplication[] = []

  for (const promo of promos.filter((p) => p.active)) {
    if (promo.conditions.length === 0) continue

    let times = Infinity
    for (const cond of promo.conditions) {
      if (cond.qty <= 0) { times = 0; break }
      if (cond.kind === 'category') {
        const catKey = cond.id.toLowerCase().trim()
        const available = (catMap[catKey] ?? []).reduce((s, pid) => s + (remaining[pid] ?? 0), 0)
        times = Math.min(times, Math.floor(available / cond.qty))
      } else {
        times = Math.min(times, Math.floor((remaining[cond.id] ?? 0) / cond.qty))
      }
    }

    if (!isFinite(times) || times <= 0) continue

    let unitCostConsumed = 0

    for (const cond of promo.conditions) {
      if (cond.kind === 'category') {
        const catKey = cond.id.toLowerCase().trim()
        let toDeduct = cond.qty * times
        for (const pid of (catMap[catKey] ?? [])) {
          if (toDeduct <= 0) break
          const take = Math.min(remaining[pid] ?? 0, toDeduct)
          remaining[pid] = (remaining[pid] ?? 0) - take
          unitCostConsumed += take * (unitPrice[pid] ?? 0)
          toDeduct -= take
        }
      } else {
        const take = cond.qty * times
        remaining[cond.id] = Math.max(0, (remaining[cond.id] ?? 0) - take)
        unitCostConsumed += take * (unitPrice[cond.id] ?? 0)
      }
    }

    const promoPrice = times * promo.bundlePrice
    applications.push({ promo, times, savings: unitCostConsumed - promoPrice })
    total += promoPrice
  }

  for (const p of products) {
    const qty = remaining[p.id] ?? 0
    if (qty > 0) total += qty * p.priceValue
  }

  return { total, applications }
}

export function calcTotal(
  qtys: Record<string, number>,
  products: Product[],
  promos: Promo[]
): number {
  return calcBreakdown(qtys, products, promos).total
}
