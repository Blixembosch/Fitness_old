// Overview = the "how is it going" summary that opens the Stats tab: one window (a week or a
// month) reduced to a handful of honest numbers — workouts done, protein and calories against
// target, bodyweight movement, and training volume — each with its change against the window
// just before it. Pure and framework-free; the view only formats what this returns.
//
// All the real math lives in nutrition.js (protein/kcal) and history.js (which day a workout
// belongs to); this file only slices by date window and diffs against the previous one.

import { isoOf, todayISO } from './format.js'
import { workoutDay } from './history.js'
import { nutritionDays, proteinAdherence } from './nutrition.js'
import { isWarmupRow } from './workout-model.js'

/** The ISO day `n` days before `fromISO` (n may be negative). */
function shiftISO(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return isoOf(d)
}

/**
 * The inclusive [start, end] ISO window of the last `days` days ending today, and the window of
 * the same length immediately before it — so a card can show "this week" beside "vs last week".
 */
export function overviewWindow(days, today = todayISO()) {
  const end = today
  const start = shiftISO(end, -(days - 1))
  const prevEnd = shiftISO(start, -1)
  const prevStart = shiftISO(prevEnd, -(days - 1))
  return { days, start, end, prevStart, prevEnd }
}

// Working sets actually completed in a list of workouts — warm-ups and undone rows don't count.
function workingSets(workouts) {
  let n = 0
  for (const w of workouts || [])
    for (const e of w.entries || [])
      for (const s of e.sets || [])
        if (s?.done === true && !isWarmupRow(s)) n++
  return n
}

const inRange = (iso, start, end) => !!iso && iso >= start && iso <= end

/**
 * One window's figures.
 *  - workouts     : sessions whose day falls in the window
 *  - sets         : completed working sets in those sessions
 *  - nutritionDays: logged nutrition days in the window
 *  - proteinAvg / proteinMet / kcalAvg : from nutrition.js over those days
 *  - deficit      : avg daily calories minus the calorie target (negative = under target), or
 *                   null when nothing is logged or there is no kcal target
 *  - weight       : { first, last, delta } from the weigh-ins in the window, or null
 */
function windowStats(S, start, end, targets) {
  const workouts = (S?.workouts || []).filter(w => inRange(workoutDay(w), start, end))
  const nutDays = nutritionDays(S).filter(d => inRange(d.date, start, end))
  const proteinTarget = Number(targets?.protein) || 0
  const kcalTarget = Number(targets?.kcal) || 0
  const ad = proteinAdherence(nutDays, proteinTarget)
  const bw = (S?.bodyweight || [])
    .filter(b => inRange(b.d, start, end))
    .slice()
    .sort((a, b) => String(a.d).localeCompare(String(b.d)))
  const weight = bw.length
    ? { first: bw[0].w, last: bw[bw.length - 1].w, delta: Math.round((bw[bw.length - 1].w - bw[0].w) * 10) / 10 }
    : null
  const deficit = ad.days > 0 && kcalTarget > 0 ? Math.round(ad.avgKcal - kcalTarget) : null
  return {
    workouts: workouts.length,
    sets: workingSets(workouts),
    nutritionDays: ad.days,
    proteinAvg: ad.avgProtein,
    proteinMet: ad.metDays,
    proteinTarget,
    kcalAvg: ad.avgKcal,
    kcalTarget,
    deficit,
    weight,
  }
}

/**
 * Full overview for a window of `days` days ending today, plus the same-length window before it
 * (as `.prev`) so the view can show each metric's change. `targets` is S.nutritionTargets.
 */
export function overview(S, days, { today = todayISO(), targets = S?.nutritionTargets } = {}) {
  const win = overviewWindow(days, today)
  const cur = windowStats(S, win.start, win.end, targets)
  const prev = windowStats(S, win.prevStart, win.prevEnd, targets)
  // Latest weigh-in overall (not just in-window) — the headline figure on the weight card.
  const allBw = (S?.bodyweight || []).slice().sort((a, b) => String(a.d).localeCompare(String(b.d)))
  const latestWeight = allBw.length ? allBw[allBw.length - 1].w : null
  return { ...win, ...cur, prev, latestWeight }
}

/** Weigh-ins in the window as chart points [{ t, y, d }], oldest first — for the weight sparkline. */
export function overviewWeightPoints(S, days, today = todayISO()) {
  const { start, end } = overviewWindow(days, today)
  return (S?.bodyweight || [])
    .filter(b => inRange(b.d, start, end))
    .map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))
    .sort((a, b) => a.t - b.t)
}
