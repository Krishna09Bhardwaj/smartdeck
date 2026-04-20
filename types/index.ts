export interface Deck {
  id: string
  user_id: string
  title: string
  description: string | null
  card_count: number
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  deck_id: string
  question: string
  answer: string
  position: number
  created_at: string
}

export interface CardReview {
  id: string
  card_id: string
  user_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_date: string
  last_quality: number | null
  updated_at: string
}

export interface CardWithReview extends Card {
  card_reviews: CardReview[]
}

export type ReviewQuality = 1 | 3 | 4 | 5

export interface SM2Input {
  ease_factor: number
  interval_days: number
  repetitions: number
  quality: ReviewQuality
}

export interface SM2Output {
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_date: string
}

export interface GeneratedCard {
  question: string
  answer: string
}
