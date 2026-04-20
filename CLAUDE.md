# SmartDeck — Session Memory

## Project
AI-powered flashcard app built for Cuemath AI Builder Challenge Round 2.
Deadline: 2026-04-22 11:00 AM.
Deployment: Vercel + Supabase.

## What Has Been Built
- [x] Full Next.js 14 App Router scaffold (TypeScript, Tailwind, shadcn/ui, Framer Motion)
- [x] TypeScript types (`types/index.ts`)
- [x] SM-2 algorithm with unit tests (`lib/sm2.ts`, `lib/sm2.test.ts`) — 8/8 passing
- [x] Supabase schema with RLS (`supabase/schema.sql`)
- [x] Supabase browser + server clients (`lib/supabase/`)
- [x] PDF parser wrapper — server-side only (`lib/pdf-parser.ts`)
- [x] Claude API wrapper — server-side only (`lib/claude.ts`)
- [x] Auth middleware — session refresh + route protection (`middleware.ts`)
- [x] Login + signup pages (`app/(auth)/`)
- [x] App layout + sidebar nav (`app/(app)/layout.tsx`, `components/nav.tsx`)
- [x] API routes: deck CRUD, due cards, generate (PDF→Claude), SM-2 reviews
- [x] Flashcard flip component with Framer Motion (`components/flashcard.tsx`)
- [x] Study session orchestrator (`components/study-session.tsx`)
- [x] Upload zone drag-and-drop (`components/upload-zone.tsx`)
- [x] Deck card widget (`components/deck-card.tsx`)
- [x] Progress ring SVG (`components/progress-ring.tsx`)
- [x] Dashboard page with due counts per deck
- [x] New deck / upload page with status feedback
- [x] Deck overview page with stats + card list + delete
- [x] Study session page (SM-2 driven, flip animation, 4 rating buttons)
- [x] Progress page (mastery % per deck, overall ring)
- [x] Landing page with feature cards

## What Is In Progress
Nothing — build complete. Pending: Supabase credentials + Vercel deployment.

## What Still Needs To Be Done
- [ ] Fill in `.env.local` with real Supabase + Anthropic credentials
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Push to GitHub + deploy to Vercel

## Key Decisions
- Private decks only — no sharing
- SM-2 quality mapped to 4 buttons: Forgot(1) / Hard(3) / Good(4) / Easy(5)
- PDF text truncated to 15,000 chars before Claude call
- card_reviews rows created lazily on first review (not at card creation)
- Scanned PDFs (<100 chars extracted) fail with a clear user-facing error
- ANTHROPIC_API_KEY + Supabase keys: server-side only, never in client code
- Mastery threshold: interval_days >= 21 (card has been pushed out 3+ weeks)

## Security
- [x] .env.local in .gitignore
- [x] ANTHROPIC_API_KEY only in lib/claude.ts (imported by API routes only)
- [x] RLS enabled on all tables with user-scoped SELECT/INSERT/UPDATE/DELETE
- [x] All API routes verify auth.uid() before any DB operation
- [x] File type + size validated client-side AND server-side
- [x] Claude response validated as JSON array before DB insert

## Local Dev
```bash
npm install
npm run dev       # http://localhost:3000
npm test          # run SM-2 unit tests (8 passing)
npm run type-check
```

## Required .env.local
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

## Deployment Steps
1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Push repo to GitHub
3. Import into Vercel → set all 4 env vars in dashboard
4. Deploy
5. Test: signup → upload PDF → study session → progress page

## File Structure
```
app/
  (auth)/login,signup        # public auth pages
  (app)/                     # protected — auth guard in layout
    dashboard/               # deck list + due counts
    decks/new/               # PDF upload flow
    decks/[deckId]/          # deck overview
    decks/[deckId]/study/    # SM-2 study session
    progress/                # mastery overview
  api/
    generate/                # POST: PDF → Claude → cards (server only)
    decks/                   # CRUD
    reviews/                 # POST: SM-2 rating
components/
  nav, flashcard, study-session, upload-zone, deck-card, progress-ring
lib/
  supabase/client,server     # browser + server clients
  sm2.ts                     # pure SM-2 math
  pdf-parser.ts              # server-side only
  claude.ts                  # server-side only (ANTHROPIC_API_KEY here)
middleware.ts                # session refresh + route guards
supabase/schema.sql          # run once in Supabase SQL Editor
```
