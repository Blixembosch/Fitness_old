import { describe, it, expect } from 'vitest'
import { overview, overviewWindow, overviewWeightPoints } from './overview.js'

// A fixed "today" so the windows are deterministic. Sunday 2026-10-18.
const TODAY = '2026-10-18'
const iso = (base, n) => { const d = new Date(base + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

// Build a workout on a given ISO day with `done` working sets (+ one warm-up that must not count).
const workout = (d, doneSets) => ({
  id: 'w-' + d, d, start: new Date(d + 'T10:00:00').getTime(), entries: [{
    id: '0025',
    sets: [{ warmup: true, done: true }, ...Array.from({ length: doneSets }, () => ({ done: true }))],
  }],
})
const nut = (d, protein, kcal) => [d, { _ts: 1, protein, kcal }]

const targets = { kcal: 1800, protein: 150 }

const S = {
  nutritionTargets: targets,
  workouts: [
    workout(iso(TODAY, 0), 4),     // today
    workout(iso(TODAY, -3), 3),    // this week
    workout(iso(TODAY, -9), 5),    // previous week
  ],
  nutrition: Object.fromEntries([
    nut(iso(TODAY, 0), 160, 1500),   // in-week, protein met
    nut(iso(TODAY, -2), 120, 1700),  // in-week, protein missed
    nut(iso(TODAY, -10), 140, 1900), // previous week
  ]),
  bodyweight: [
    { d: iso(TODAY, -10), w: 103, t: new Date(iso(TODAY, -10)).getTime() },
    { d: iso(TODAY, -6), w: 102, t: new Date(iso(TODAY, -6)).getTime() },
    { d: iso(TODAY, 0), w: 101, t: new Date(iso(TODAY, 0)).getTime() },
  ],
}

describe('overviewWindow', () => {
  it('spans the last N days ending today, with the matching previous window', () => {
    const w = overviewWindow(7, TODAY)
    expect(w).toMatchObject({ days: 7, start: '2026-10-12', end: '2026-10-18', prevStart: '2026-10-05', prevEnd: '2026-10-11' })
  })
})

describe('overview — weekly window', () => {
  const o = overview(S, 7, { today: TODAY })

  it('counts workouts in the window and completed working sets (no warm-ups)', () => {
    expect(o.workouts).toBe(2)   // today + 3 days ago
    expect(o.sets).toBe(7)       // 4 + 3, warm-ups excluded
  })

  it('averages protein and counts days on target', () => {
    expect(o.proteinAvg).toBe(140)   // (160 + 120) / 2
    expect(o.proteinMet).toBe(1)     // only the 160 g day
    expect(o.nutritionDays).toBe(2)
  })

  it('reads calorie deficit as avg intake minus target (negative = under)', () => {
    expect(o.kcalAvg).toBe(1600)     // (1500 + 1700) / 2
    expect(o.deficit).toBe(-200)     // 1600 − 1800
  })

  it('tracks weight movement across the window and the latest overall', () => {
    expect(o.weight).toMatchObject({ first: 102, last: 101, delta: -1 })
    expect(o.latestWeight).toBe(101)
  })

  it('exposes the previous window for change figures', () => {
    expect(o.prev.workouts).toBe(1)        // the day-9 session
    expect(o.prev.proteinAvg).toBe(140)    // the day-10 nutrition day
  })
})

describe('overview — no data degrades cleanly', () => {
  const o = overview({ workouts: [], nutrition: {}, bodyweight: [], nutritionTargets: targets }, 7, { today: TODAY })
  it('is all zeros / nulls, never NaN', () => {
    expect(o.workouts).toBe(0)
    expect(o.proteinAvg).toBe(0)
    expect(o.deficit).toBeNull()
    expect(o.weight).toBeNull()
    expect(o.latestWeight).toBeNull()
  })
})

describe('overviewWeightPoints', () => {
  it('returns in-window weigh-ins oldest first', () => {
    const pts = overviewWeightPoints(S, 7, TODAY)
    expect(pts.map(p => p.y)).toEqual([102, 101])
  })
})
