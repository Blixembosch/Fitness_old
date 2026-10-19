// What a weekday card shows at a glance: the focus (for its colour), the main muscle groups
// (as body-part keys the view translates), and a rough set count and duration. Pure and framework
// -free; the Plan screen only formats what these return. Built from a day's routines (one, or
// several on a combined day).

import { EXIDX } from './exercises.js'

const UPPER = new Set(['chest', 'back', 'shoulders', 'upper arms', 'lower arms', 'neck'])
const LOWER = new Set(['upper legs', 'lower legs'])

const exList = routines => (Array.isArray(routines) ? routines : [routines])
  .filter(Boolean).flatMap(r => (Array.isArray(r.ex) ? r.ex : []))

const bpOf = e => EXIDX[e?.id]?.bp || null

/**
 * 'upper' | 'lower' | 'cardio' | 'full' — the colour a day is coded with. Cardio wins when it is
 * the bulk of the work; otherwise whichever of upper/lower body has more exercises, 'full' on a tie
 * or an empty day.
 */
export function dayFocus(routines) {
  const bps = exList(routines).map(bpOf).filter(Boolean)
  if (!bps.length) return 'full'
  let up = 0, lo = 0, cardio = 0
  for (const bp of bps) {
    if (bp === 'cardio') cardio++
    else if (UPPER.has(bp)) up++
    else if (LOWER.has(bp)) lo++
  }
  if (cardio > bps.length / 2) return 'cardio'
  if (up > lo) return 'upper'
  if (lo > up) return 'lower'
  return 'full'
}

/** The day's main muscle groups as body-part keys, most-worked first, at most `max`. The caller
 *  translates each key (t(bp)). */
export function dayMuscles(routines, max = 3) {
  const count = new Map()
  for (const bp of exList(routines).map(bpOf).filter(Boolean)) {
    if (bp === 'cardio' || bp === 'full body') continue
    count.set(bp, (count.get(bp) || 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([bp]) => bp)
}

/** Rough work for a day: total working sets, and an estimate in minutes (about 3.5 min per set,
 *  rounded to 5). Zero sets gives zero minutes, so an empty routine doesn't claim time. */
export function dayLoad(routines) {
  const sets = exList(routines).reduce((n, e) => n + (Number(e.sets) > 0 ? Math.round(Number(e.sets)) : 0), 0)
  const minutes = sets ? Math.max(5, Math.round((sets * 3.5) / 5) * 5) : 0
  return { exercises: exList(routines).length, sets, minutes }
}
