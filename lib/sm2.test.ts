import { describe, it, expect } from 'vitest'
import { calculateSM2 } from './sm2'

describe('calculateSM2', () => {
  const defaults = { ease_factor: 2.5, interval_days: 1, repetitions: 0 }

  it('resets interval and repetitions on failure (quality < 3)', () => {
    const result = calculateSM2({ ...defaults, repetitions: 3, interval_days: 10, quality: 1 })
    expect(result.interval_days).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('sets interval to 1 on first successful review', () => {
    const result = calculateSM2({ ...defaults, repetitions: 0, quality: 4 })
    expect(result.interval_days).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('sets interval to 6 on second successful review', () => {
    const result = calculateSM2({ ...defaults, repetitions: 1, interval_days: 1, quality: 4 })
    expect(result.interval_days).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('multiplies interval by ease_factor on third+ review', () => {
    const result = calculateSM2({ ease_factor: 2.5, interval_days: 6, repetitions: 2, quality: 4 })
    expect(result.interval_days).toBe(15)
    expect(result.repetitions).toBe(3)
  })

  it('increases ease_factor for easy cards', () => {
    const result = calculateSM2({ ...defaults, quality: 5 })
    expect(result.ease_factor).toBeGreaterThan(2.5)
  })

  it('decreases ease_factor for hard cards', () => {
    const result = calculateSM2({ ...defaults, quality: 3 })
    expect(result.ease_factor).toBeLessThan(2.5)
  })

  it('never drops ease_factor below 1.3', () => {
    const result = calculateSM2({ ease_factor: 1.3, interval_days: 1, repetitions: 0, quality: 1 })
    expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
  })

  it('returns a valid ISO date string for next_review_date', () => {
    const result = calculateSM2({ ...defaults, quality: 5 })
    expect(result.next_review_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
