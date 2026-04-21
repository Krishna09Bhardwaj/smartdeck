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
- [x] Groq API wrapper — server-side only (`lib/claude.ts`, uses GROQ_API_KEY)
- [x] Auth middleware — session refresh + route protection (`middleware.ts`)
- [x] Login + signup pages (`app/(auth)/`)
- [x] App layout + sidebar nav (`app/(app)/layout.tsx`, `components/nav.tsx`)
- [x] API routes: deck CRUD, due cards, generate (PDF→Groq), SM-2 reviews, profile, stats
- [x] Flashcard flip component with swipe gestures (`components/flashcard.tsx`)
- [x] Study session orchestrator with XP, focus mode, confetti (`components/study-session.tsx`)
- [x] Upload zone drag-and-drop (`components/upload-zone.tsx`)
- [x] Deck card widget with stagger animation (`components/deck-card.tsx`)
- [x] Progress ring SVG (`components/progress-ring.tsx`)
- [x] XP toast component (`components/xp-toast.tsx`)
- [x] Focus mode provider + aware layout (`components/focus-provider.tsx`, `components/focus-aware-layout.tsx`)
- [x] Deck card row client component (`components/deck-card-row.tsx`)
- [x] Dashboard page — time-based greeting, semantic stat cards
- [x] New deck / upload page with status feedback
- [x] Deck overview page — retention risk section with exponential decay, stacked health bar
- [x] Study session page — swipe gestures, XP feedback, focus mode, session timer, confetti end screen
- [x] Progress page (mastery % per deck, overall ring)
- [x] Stats page — heatmap with month/day labels, CSS tooltip, deck breakdown table
- [x] How It Works page — forgetting curve SVG, FAQ accordion
- [x] Loading skeletons: `decks/[deckId]/loading.tsx`, `stats/loading.tsx`
- [x] Gamification: `profiles` table, XP system, streak tracking, level-up
- [x] Landing page with feature cards

## What Has Been Completed (Post-Build)
- [x] Comprehensive README.md written (arch decisions, setup, improvements, SM-2 explanation)
- [x] `.env.example` committed
- [x] Final secret scan — clean
- [x] GitHub repo created: https://github.com/Krishna09Bhardwaj/smartdeck
- [x] Recallio-style dark UI overhaul committed and pushed
- [x] Build: zero TS errors, zero ESLint warnings
- [x] Security: IDOR check on reviews, no secrets in client code

## What Still Needs To Be Done
- [ ] Run `supabase/migrations/002_gamification.sql` in Supabase SQL Editor (for XP/profiles/streaks)
- [ ] Provide 3 Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] Provide GROQ_API_KEY (starts with gsk_)
- [ ] Fill `.env.local` with real credentials (for local dev)
- [ ] Update README.md live URL placeholder after Vercel deploy
- [ ] End-to-end test: signup → upload PDF → study → progress

## Key Decisions
- Private decks only — no sharing
- SM-2 quality mapped to 4 buttons: Forgot(1) / Hard(3) / Good(4) / Easy(5)
- Swipe gestures: right=Easy, left=Hard, up=Good (pointer events, no library)
- XP: Easy=15, Good=10, Hard=5, Forgot=2 — 500 XP per level
- PDF text truncated to 15,000 chars before Groq call
- card_reviews rows created lazily on first review (not at card creation)
- Scanned PDFs (<100 chars extracted) fail with a clear user-facing error
- GROQ_API_KEY + Supabase keys: server-side only, never in client code
- Mastery threshold: interval_days >= 21 (card has been pushed out 3+ weeks)
- Retention decay: `Math.exp(-daysSince / (intervalDays * 0.7)) * 100`
- Focus mode: React Context (FocusProvider) — hides sidebar, scoped to session
- AI provider: Groq (llama-3.3-70b-versatile) via groq-sdk, NOT Anthropic

## Security
- [x] .env.local in .gitignore
- [x] GROQ_API_KEY only in lib/claude.ts (imported by API routes only)
- [x] RLS enabled on all tables with user-scoped SELECT/INSERT/UPDATE/DELETE
- [x] All API routes verify auth.uid() before any DB operation
- [x] IDOR prevention: card ownership verified before accepting reviews
- [x] File type + size validated client-side AND server-side
- [x] Groq response validated as JSON array before DB insert

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
GROQ_API_KEY=
```

## Deployment Steps
1. Run `supabase/schema.sql` in Supabase SQL Editor (initial schema)
2. Run `supabase/migrations/002_gamification.sql` in Supabase SQL Editor (XP/profiles)
3. Push repo to GitHub (done — auto-deploys to Vercel)
4. Set 4 env vars in Vercel dashboard
5. Test: signup → upload PDF → study session → progress page

## File Structure
```
app/
  (auth)/login,signup           # public auth pages
  (app)/                        # protected — auth guard in layout
    dashboard/                  # deck list + due counts, greeting
    decks/new/                  # PDF upload flow
    decks/[deckId]/             # deck overview + retention risk
    decks/[deckId]/study/       # SM-2 study session
    decks/[deckId]/loading.tsx  # skeleton
    progress/                   # mastery overview
    stats/                      # heatmap + deck breakdown
    stats/loading.tsx           # skeleton
  api/
    generate/                   # POST: PDF → Groq → cards (server only)
    decks/                      # CRUD
    reviews/                    # POST: SM-2 rating + XP
    profile/                    # GET: XP/level/streak for sidebar
    stats/                      # GET: heatmap + deck breakdown
components/
  nav                           # sidebar with XP bar + streak
  flashcard                     # swipe gestures + flip animation
  study-session                 # XP toast, focus mode, confetti end
  upload-zone                   # drag-and-drop PDF
  deck-card                     # stagger animation hover lift
  deck-card-row                 # client component for deck overview rows
  progress-ring                 # SVG ring
  xp-toast                      # floating "+X XP" feedback
  focus-provider                # React Context for focus mode
  focus-aware-layout            # conditionally renders Nav
lib/
  supabase/client,server        # browser + server clients
  sm2.ts                        # pure SM-2 math
  pdf-parser.ts                 # server-side only
  claude.ts                     # server-side only (GROQ_API_KEY here)
middleware.ts                   # session refresh + route guards
supabase/schema.sql             # run once in Supabase SQL Editor
supabase/migrations/002_gamification.sql  # profiles + XP columns
```
