import type { SM2Input, SM2Output } from '@/types'

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { quality } = input
  let { ease_factor, interval_days, repetitions } = input

  if (quality < 3) {
    repetitions = 0
    interval_days = 1
  } else {
    if (repetitions === 0) {
      interval_days = 1
    } else if (repetitions === 1) {
      interval_days = 6
    } else {
      interval_days = Math.round(interval_days * ease_factor)
    }
    repetitions += 1
  }

  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  ease_factor = Math.max(1.3, parseFloat(ease_factor.toFixed(4)))

  const next_review_date = toISODate(addDays(new Date(), interval_days))

  return { ease_factor, interval_days, repetitions, next_review_date }
}

export function getDefaultReview(): Omit<SM2Input, 'quality'> {
  return { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
}
