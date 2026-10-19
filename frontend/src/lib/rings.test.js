import { describe, it, expect } from 'vitest'
import { homeRings } from './rings.js'

const TODAY = '2026-10-19'
const base = {
  weekStart: 1, routines: [], week: {}, dayPlan: {}, queue: null, rotation: null,
  workouts: [], nutrition: {}, nutritionTargets: { protein: 150, kcal: 1800 },
}

describe('homeRings', () => {
  it('reads protein and calories today against target, with a signed deficit', () => {
    const S = { ...base, nutrition: { [TODAY]: { _ts: 1, protein: 120, kcal: 1500 } } }
    const r = homeRings(S, TODAY)
    expect(r.protein).toEqual({ done: 120, target: 150, pct: 0.8 })
    expect(r.calorie.done).toBe(1500)
    expect(r.calorie.target).toBe(1800)
    expect(r.calorie.deficit).toBe(-300)         // 1500 − 1800, under target
    expect(r.calorie.pct).toBeCloseTo(1500 / 1800, 5)
  })

  it('clamps the fill at one full turn when over target, and over-eating is a positive deficit', () => {
    const S = { ...base, nutrition: { [TODAY]: { _ts: 1, protein: 180, kcal: 2000 } } }
    const r = homeRings(S, TODAY)
    expect(r.protein.pct).toBe(1)                // 180/150 clamped
    expect(r.calorie.deficit).toBe(200)          // over target
  })

  it('leaves deficit null when nothing is logged today', () => {
    const r = homeRings(base, TODAY)
    expect(r.calorie.deficit).toBeNull()
    expect(r.protein).toEqual({ done: 0, target: 150, pct: 0 })
  })

  it('counts the week\'s workouts against the plan for the training ring', () => {
    const S = {
      ...base,
      routines: [{ id: 'r1', name: 'A', ex: [{ id: '0025' }] }],
      week: { 0: ['r1'], 1: ['r1'], 2: ['r1'] },        // three planned days
      workouts: [{ id: 'w1', d: TODAY, start: Date.now(), routineIds: ['r1'], entries: [] }],
    }
    const r = homeRings(S, TODAY)
    expect(r.workout.done).toBe(1)
    expect(r.workout.target).toBe(3)
    expect(r.workout.pct).toBeCloseTo(1 / 3, 5)
  })
})
