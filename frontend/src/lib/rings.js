// The three activity rings on Home: training done this week, protein today, and calories today —
// each a done/target pair plus a 0..1 fill the ring draws. Pure and framework-free; the component
// only renders what this returns. Week training reuses weekTally (lib/queue.js, coach-week aware);
// nutrition reads today's entry against the stored targets.

import { todayISO } from './format.js'
import { weekTally } from './queue.js'
import { nutritionOf } from './nutrition.js'

const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0)

// A ring never overflows: the fill is clamped to one full turn even past target.
function ring(done, target) {
  const d = Math.max(0, Math.round(num(done) * 10) / 10)
  const t = num(target) > 0 ? Math.round(num(target)) : 0
  return { done: d, target: t, pct: t > 0 ? Math.min(1, d / t) : d > 0 ? 1 : 0 }
}

/**
 * { workout, protein, calorie } for Home's ring row.
 *  - workout : sessions done this week over the week's plan (weekTally)
 *  - protein : grams today over the protein target
 *  - calorie : kcal today over the calorie target, plus `deficit` = today's intake minus the
 *              target (negative = under target), or null when nothing is logged / no target
 */
export function homeRings(S, today = todayISO()) {
  const wk = weekTally(S, today)
  const todayN = nutritionOf(S, today) || {}
  const targets = S?.nutritionTargets || {}
  const calorie = ring(todayN.kcal, targets.kcal)
  const deficit = calorie.target > 0 && todayN.kcal != null ? Math.round(num(todayN.kcal) - calorie.target) : null
  return {
    workout: ring(wk.done, wk.planned),
    protein: ring(todayN.protein, targets.protein),
    calorie: { ...calorie, deficit },
  }
}
