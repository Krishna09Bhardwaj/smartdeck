-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Decks table
CREATE TABLE decks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  card_count   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  position    INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card reviews table (SM-2 state, one row per card per user)
CREATE TABLE card_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id           UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ease_factor       FLOAT NOT NULL DEFAULT 2.5,
  interval_days     INT NOT NULL DEFAULT 1,
  repetitions       INT NOT NULL DEFAULT 0,
  next_review_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  last_quality      INT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (card_id, user_id)
);

-- Indexes
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_card_reviews_user_next ON card_reviews(user_id, next_review_date);
CREATE INDEX idx_card_reviews_card_user ON card_reviews(card_id, user_id);

-- RLS
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

-- Deck policies
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own decks"
  ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE USING (auth.uid() = user_id);

-- Card policies (via deck ownership)
CREATE POLICY "Users can view cards of their decks"
  ON cards FOR SELECT USING (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid())
  );
CREATE POLICY "Users can insert cards into their decks"
  ON cards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid())
  );
CREATE POLICY "Users can delete cards from their decks"
  ON cards FOR DELETE USING (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid())
  );

-- Card review policies
CREATE POLICY "Users can view their own reviews"
  ON card_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reviews"
  ON card_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews"
  ON card_reviews FOR UPDATE USING (auth.uid() = user_id);
