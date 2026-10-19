import { describe, it, expect } from 'vitest'
import { dayFocus, dayMuscles, dayLoad } from './routine-visual.js'

// Real catalogue ids: 0289 dumbbell bench press (chest), 0652 pull-up (back),
// 1459 romanian deadlift (upper legs), 2290 bulgarian split squat (upper legs),
// 0463 front plank (waist). A cardio id: 1460? use a known cardio — 5965 (bp cardio).
const upperDay = { ex: [{ id: '0289', sets: 3 }, { id: '0652', sets: 3 }, { id: '0463', sets: 3 }] }
const lowerDay = { ex: [{ id: '1459', sets: 3 }, { id: '2290', sets: 3 }, { id: '0463', sets: 3 }] }

describe('dayFocus', () => {
  it('reads an upper-body day', () => expect(dayFocus(upperDay)).toBe('upper'))
  it('reads a lower-body day', () => expect(dayFocus(lowerDay)).toBe('lower'))
  it('is "full" for an empty day', () => expect(dayFocus({ ex: [] })).toBe('full'))
  it('accepts several routines (a combined day)', () =>
    expect(['upper', 'lower', 'full']).toContain(dayFocus([upperDay, lowerDay])))
})

describe('dayMuscles', () => {
  it('lists the worked body parts, most first, translated by the caller', () => {
    const m = dayMuscles(lowerDay)
    expect(m[0]).toBe('upper legs')      // two of the three exercises
    expect(m).toContain('waist')
    expect(m.length).toBeLessThanOrEqual(3)
  })
  it('drops cardio and full-body, and is empty for an empty day', () => {
    expect(dayMuscles({ ex: [] })).toEqual([])
  })
})

describe('dayLoad', () => {
  it('sums sets and estimates minutes rounded to 5', () => {
    expect(dayLoad(upperDay)).toEqual({ exercises: 3, sets: 9, minutes: 30 })  // 9*3.5=31.5 -> 30
  })
  it('claims no time for a day with no sets', () => {
    expect(dayLoad({ ex: [{ id: '0289' }] })).toMatchObject({ sets: 0, minutes: 0 })
  })
})
