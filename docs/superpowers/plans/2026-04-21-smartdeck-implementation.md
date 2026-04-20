# SmartDeck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SmartDeck — an AI-powered spaced repetition flashcard app — end to end, deployed on Vercel with Supabase, ready for the Cuemath AI Builder Challenge deadline.

**Architecture:** Next.js 14 App Router with server-side API routes for all AI and database calls. Supabase handles Postgres (with RLS) and Auth. SM-2 scheduling runs as a pure server-side function. All secrets stay in environment variables, never in client code.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase (@supabase/ssr), Anthropic SDK, pdf-parse, Vitest (unit tests), Vercel (deployment)

---

## File Map

```
smartdeck/
├── .env.local                              # secrets — gitignored
├── .gitignore
├── CLAUDE.md
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── vitest.config.ts
│
├── app/
│   ├── globals.css
│   ├── layout.tsx                          # root HTML shell, fonts
│   ├── page.tsx                            # landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                      # auth guard + sidebar nav
│   │   ├── dashboard/page.tsx              # due today + deck list
│   │   ├── decks/
│   │   │   ├── new/page.tsx                # upload PDF flow
│   │   │   └── [deckId]/
│   │   │       ├── page.tsx                # deck overview
│   │   │       └── study/page.tsx          # full-screen study session
│   │   └── progress/page.tsx              # mastery overview
│   └── api/
│       ├── generate/route.ts              # POST: PDF → Claude → cards
│       ├── decks/
│       │   ├── route.ts                   # GET list, POST create
│       │   └── [deckId]/
│       │       ├── route.ts               # GET one, DELETE
│       │       ├── cards/route.ts         # GET all cards
│       │       └── due/route.ts           # GET due today
│       └── reviews/route.ts              # POST: SM-2 rating submit
│
├── components/
│   ├── ui/                                # shadcn primitives (auto-generated)
│   ├── nav.tsx                            # sidebar navigation
│   ├── deck-card.tsx                      # deck thumbnail widget
│   ├── flashcard.tsx                      # flip animation card
│   ├── study-session.tsx                  # orchestrates study flow
│   ├── upload-zone.tsx                    # PDF drag-and-drop
│   └── progress-ring.tsx                  # circular mastery meter
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # browser Supabase client
│   │   └── server.ts                      # server Supabase client
│   ├── sm2.ts                             # pure SM-2 math
│   ├── pdf-parser.ts                      # server-side pdf-parse wrapper
│   └── claude.ts                          # Anthropic SDK wrapper (server only)
│
├── hooks/
│   └── use-due-count.ts                   # SWR hook for due-today count
│
├── middleware.ts                          # Supabase Auth session refresh
│
└── types/
    └── index.ts                           # shared TypeScript types
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `vitest.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1.1: Scaffold Next.js project**

```bash
cd /Users/krishnabhardwaj/developer/cuemath
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 1.2: Install all dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk pdf-parse framer-motion swr
npm install -D vitest @vitejs/plugin-react @types/pdf-parse
```

- [ ] **Step 1.3: Install shadcn/ui**

```bash
npx shadcn@latest init --defaults
npx shadcn@latest add button card input label progress badge toast separator skeleton
```

- [ ] **Step 1.4: Create `.gitignore`** (add to existing)

```
.env.local
.env*.local
node_modules/
.next/
```

- [ ] **Step 1.5: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 1.6: Update `package.json` test script**

Add to scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 1.7: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

- [ ] **Step 1.8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: TypeScript Types + SM-2 Algorithm

**Files:**
- Create: `types/index.ts`
- Create: `lib/sm2.ts`
- Create: `lib/sm2.test.ts`

- [ ] **Step 2.1: Create `types/index.ts`**

```typescript
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
  next_review_date: string  // ISO date string YYYY-MM-DD
  last_quality: number | null
  updated_at: string
}

export interface CardWithReview extends Card {
  card_reviews: CardReview[]
}

export type ReviewQuality = 1 | 3 | 4 | 5  // Forgot | Hard | Good | Easy

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
  next_review_date: string  // ISO date YYYY-MM-DD
}

export interface GenerateCardsRequest {
  title: string
  description?: string
}

export interface GeneratedCard {
  question: string
  answer: string
}
```

- [ ] **Step 2.2: Create `lib/sm2.ts`**

```typescript
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
```

- [ ] **Step 2.3: Create `lib/sm2.test.ts`**

```typescript
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
    expect(result.interval_days).toBe(15)  // round(6 * 2.5)
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
```

- [ ] **Step 2.4: Run tests — expect all to pass**

```bash
npm test
```

Expected: 8 tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add types/index.ts lib/sm2.ts lib/sm2.test.ts
git commit -m "feat: add TypeScript types and SM-2 algorithm with tests"
```

---

## Task 3: Supabase Schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 3.1: Create `supabase/schema.sql`**

```sql
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
```

- [ ] **Step 3.2: Run this SQL in your Supabase project**

Go to your Supabase dashboard → SQL Editor → paste the contents of `supabase/schema.sql` → Run.

Verify tables `decks`, `cards`, `card_reviews` appear in Table Editor with RLS enabled (shield icon).

- [ ] **Step 3.3: Copy env vars from Supabase**

In Supabase dashboard → Project Settings → API:
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

- [ ] **Step 3.4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema with RLS policies"
```

---

## Task 4: Supabase Clients + Server Libraries

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/pdf-parser.ts`
- Create: `lib/claude.ts`
- Create: `middleware.ts`

- [ ] **Step 4.1: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4.2: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4.3: Create `lib/pdf-parser.ts`**

```typescript
import pdfParse from 'pdf-parse'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}

export function truncateText(text: string, maxChars = 15000): string {
  return text.slice(0, maxChars)
}

export function isTextExtractable(text: string): boolean {
  return text.trim().length >= 100
}
```

- [ ] **Step 4.4: Create `lib/claude.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedCard } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a skilled educator creating flashcards from a student's study material. Generate exactly 15-25 high-quality flashcards. Each card must have a clear, specific question and a thorough but concise answer (2-4 sentences). Cover key concepts, definitions, relationships, and important examples. Avoid trivial or redundant cards. Return ONLY a valid JSON array: [{"question": "...", "answer": "..."}, ...]`

export async function generateFlashcards(extractedText: string): Promise<GeneratedCard[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate flashcards from this study material:\n\n${extractedText}`,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse flashcard JSON from Claude response')

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards generated')

  return cards.filter(
    (c) => typeof c.question === 'string' && typeof c.answer === 'string' && c.question && c.answer
  )
}
```

- [ ] **Step 4.5: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  const isAppPage = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/decks') ||
    request.nextUrl.pathname.startsWith('/progress')

  if (!user && isAppPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 4.6: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients, PDF parser, Claude wrapper, and auth middleware"
```

---

## Task 5: Auth Pages

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

- [ ] **Step 5.1: Create `app/(auth)/login/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your SmartDeck account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5.2: Create `app/(auth)/signup/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login"><Button variant="outline" className="w-full">Back to login</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Start learning smarter with SmartDeck</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5.3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add login and signup pages"
```

---

## Task 6: App Layout + Navigation

**Files:**
- Create: `app/layout.tsx` (update root)
- Create: `app/(app)/layout.tsx`
- Create: `components/nav.tsx`
- Update: `app/globals.css`

- [ ] **Step 6.1: Update `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

body {
  @apply bg-background text-foreground;
}
```

- [ ] **Step 6.2: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartDeck — AI Flashcards',
  description: 'Upload a PDF, get smart flashcards, study smarter with spaced repetition.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6.3: Create `components/nav.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BookOpen, LayoutDashboard, TrendingUp, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col py-6 px-4 gap-2 min-h-screen">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-4">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-lg">SmartDeck</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3 text-slate-600">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </aside>
  )
}
```

- [ ] **Step 6.4: Install lucide-react**

```bash
npm install lucide-react
```

- [ ] **Step 6.5: Create `app/(app)/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Nav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 6.6: Commit**

```bash
git add app/ components/nav.tsx
git commit -m "feat: add app layout, navigation sidebar, and root layout"
```

---

## Task 7: API Routes — Deck CRUD

**Files:**
- Create: `app/api/decks/route.ts`
- Create: `app/api/decks/[deckId]/route.ts`
- Create: `app/api/decks/[deckId]/cards/route.ts`
- Create: `app/api/decks/[deckId]/due/route.ts`

- [ ] **Step 7.1: Create `app/api/decks/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, card_count } = body

  const { data, error } = await supabase
    .from('decks')
    .insert({ user_id: user.id, title, description, card_count: card_count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 7.2: Create `app/api/decks/[deckId]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 7.3: Create `app/api/decks/[deckId]/cards/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: deck } = await supabase
    .from('decks')
    .select('id')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 7.4: Create `app/api/decks/[deckId]/due/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: deck } = await supabase
    .from('decks')
    .select('id')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  // Cards with existing reviews due today, plus cards never reviewed (no review row)
  const { data: allCards, error } = await supabase
    .from('cards')
    .select(`*, card_reviews(*)`)
    .eq('deck_id', deckId)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const due = allCards?.filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    if (!userReview) return true // never reviewed = always due
    return userReview.next_review_date <= today
  }) ?? []

  return NextResponse.json(due)
}
```

- [ ] **Step 7.5: Commit**

```bash
git add app/api/decks/
git commit -m "feat: add deck CRUD and due-cards API routes"
```

---

## Task 8: Generate API Route (PDF → Claude → Cards)

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 8.1: Create `app/api/generate/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTextFromPDF, truncateText, isTextExtractable } from '@/lib/pdf-parser'
import { generateFlashcards } from '@/lib/claude'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null

  if (!file || !title) {
    return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let extractedText: string
  try {
    extractedText = await extractTextFromPDF(buffer)
  } catch {
    return NextResponse.json({ error: 'Failed to read PDF. Make sure it is not password-protected.' }, { status: 422 })
  }

  if (!isTextExtractable(extractedText)) {
    return NextResponse.json(
      { error: 'Could not extract text from this PDF. It may be a scanned image. Please upload a text-based PDF.' },
      { status: 422 }
    )
  }

  const truncated = truncateText(extractedText)

  let cards: Array<{ question: string; answer: string }>
  try {
    cards = await generateFlashcards(truncated)
  } catch (e) {
    console.error('Claude generation failed:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }

  // Create deck
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .insert({ user_id: user.id, title: title.trim(), description: description?.trim() ?? null, card_count: cards.length })
    .select()
    .single()

  if (deckError || !deck) {
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 })
  }

  // Insert cards
  const cardRows = cards.map((c, i) => ({
    deck_id: deck.id,
    question: c.question,
    answer: c.answer,
    position: i,
  }))

  const { error: cardsError } = await supabase.from('cards').insert(cardRows)
  if (cardsError) {
    await supabase.from('decks').delete().eq('id', deck.id)
    return NextResponse.json({ error: 'Failed to save cards' }, { status: 500 })
  }

  return NextResponse.json({ deck_id: deck.id, card_count: cards.length }, { status: 201 })
}
```

- [ ] **Step 8.2: Commit**

```bash
git add app/api/generate/
git commit -m "feat: add PDF-to-flashcard generation API route via Claude"
```

---

## Task 9: Reviews API Route

**Files:**
- Create: `app/api/reviews/route.ts`

- [ ] **Step 9.1: Create `app/api/reviews/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateSM2 } from '@/lib/sm2'
import type { ReviewQuality } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { card_id, quality } = body as { card_id: string; quality: ReviewQuality }

  if (!card_id || ![1, 3, 4, 5].includes(quality)) {
    return NextResponse.json({ error: 'Invalid card_id or quality' }, { status: 400 })
  }

  // Fetch existing review state or use defaults
  const { data: existing } = await supabase
    .from('card_reviews')
    .select('*')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .single()

  const currentState = existing ?? { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
  const next = calculateSM2({ ...currentState, quality })

  const { error } = await supabase
    .from('card_reviews')
    .upsert(
      {
        card_id,
        user_id: user.id,
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        next_review_date: next.next_review_date,
        last_quality: quality,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'card_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ next_review_date: next.next_review_date, interval_days: next.interval_days })
}
```

- [ ] **Step 9.2: Commit**

```bash
git add app/api/reviews/
git commit -m "feat: add SM-2 review submission API route"
```

---

## Task 10: Flashcard Component + Study Session

**Files:**
- Create: `components/flashcard.tsx`
- Create: `components/study-session.tsx`

- [ ] **Step 10.1: Create `components/flashcard.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface FlashcardProps {
  question: string
  answer: string
  onRate: (quality: 1 | 3 | 4 | 5) => void
}

const ratingButtons = [
  { label: 'Forgot', quality: 1 as const, color: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200' },
  { label: 'Hard', quality: 3 as const, color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200' },
  { label: 'Good', quality: 4 as const, color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200' },
  { label: 'Easy', quality: 5 as const, color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200' },
]

export default function Flashcard({ question, answer, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleRate(quality: 1 | 3 | 4 | 5) {
    setFlipped(false)
    setTimeout(() => onRate(quality), 150)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-2xl cursor-pointer"
        style={{ perspective: '1000px', minHeight: '280px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d', minHeight: '280px' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Question</p>
            <p className="text-xl font-medium text-slate-800 text-center leading-relaxed">{question}</p>
            <p className="mt-6 text-sm text-slate-400">Tap to reveal answer</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-blue-50 rounded-2xl shadow-lg border border-blue-200"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-4">Answer</p>
            <p className="text-lg text-slate-800 text-center leading-relaxed">{answer}</p>
          </div>
        </motion.div>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          {ratingButtons.map(({ label, quality, color }) => (
            <button
              key={quality}
              onClick={() => handleRate(quality)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${color}`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}
      {!flipped && (
        <p className="text-sm text-slate-400">Click the card to see the answer</p>
      )}
    </div>
  )
}
```

- [ ] **Step 10.2: Create `components/study-session.tsx`**

```tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Flashcard from './flashcard'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { Card } from '@/types'
import type { ReviewQuality } from '@/types'

interface StudySessionProps {
  cards: Card[]
  deckId: string
}

interface SessionResult {
  cardId: string
  quality: ReviewQuality
  nextDate: string
}

export default function StudySession({ cards, deckId }: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [done, setDone] = useState(false)
  const router = useRouter()

  const handleRate = useCallback(async (quality: ReviewQuality) => {
    const card = cards[index]
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, quality }),
    })
    const data = await res.json()
    setResults(r => [...r, { cardId: card.id, quality, nextDate: data.next_review_date }])
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }, [index, cards])

  if (done) {
    const forgot = results.filter(r => r.quality === 1).length
    const hard = results.filter(r => r.quality === 3).length
    const good = results.filter(r => r.quality === 4).length
    const easy = results.filter(r => r.quality === 5).length

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
      >
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Session complete!</h2>
        <p className="text-slate-500">You reviewed {cards.length} cards</p>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {[
            { label: 'Forgot', count: forgot, color: 'text-red-600' },
            { label: 'Hard', count: hard, color: 'text-orange-600' },
            { label: 'Good', count: good, color: 'text-blue-600' },
            { label: 'Easy', count: easy, color: 'text-green-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>Back to deck</Button>
          <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        </div>
      </motion.div>
    )
  }

  const progress = Math.round((index / cards.length) * 100)
  const card = cards[index]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{index + 1} / {cards.length}</span>
        <div className="flex-1 mx-4">
          <Progress value={progress} className="h-2" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/decks/${deckId}`)}>Exit</Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Flashcard
            question={card.question}
            answer={card.answer}
            onRate={handleRate}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 10.3: Commit**

```bash
git add components/flashcard.tsx components/study-session.tsx
git commit -m "feat: add flashcard flip component and study session orchestrator"
```

---

## Task 11: Upload Zone + Deck Card Components

**Files:**
- Create: `components/upload-zone.tsx`
- Create: `components/deck-card.tsx`
- Create: `components/progress-ring.tsx`

- [ ] **Step 11.1: Create `components/upload-zone.tsx`**

```tsx
'use client'
import { useRef, useState, DragEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') onFileSelect(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
        <span className="flex-1 text-sm font-medium text-slate-700 truncate">{selectedFile.name}</span>
        <span className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
        <button onClick={onClear} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <Upload className="h-8 w-8 text-slate-400 mb-3" />
      <p className="text-sm font-medium text-slate-600">Drop your PDF here</p>
      <p className="text-xs text-slate-400 mt-1">or click to browse · max 10 MB</p>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />
    </div>
  )
}
```

- [ ] **Step 11.2: Create `components/deck-card.tsx`**

```tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight } from 'lucide-react'
import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
  dueCount?: number
}

export default function DeckCard({ deck, dueCount = 0 }: DeckCardProps) {
  return (
    <Link href={`/decks/${deck.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-semibold line-clamp-1">{deck.title}</CardTitle>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{deck.card_count} cards</span>
          {dueCount > 0 && (
            <Badge variant="default" className="bg-blue-600">
              {dueCount} due
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 11.3: Create `components/progress-ring.tsx`**

```tsx
interface ProgressRingProps {
  value: number  // 0-100
  size?: number
  strokeWidth?: number
  label?: string
}

export default function ProgressRing({ value, size = 80, strokeWidth = 8, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="#2563eb"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="text-sm font-bold text-slate-700 -mt-1">{Math.round(value)}%</span>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  )
}
```

- [ ] **Step 11.4: Commit**

```bash
git add components/upload-zone.tsx components/deck-card.tsx components/progress-ring.tsx
git commit -m "feat: add upload zone, deck card, and progress ring components"
```

---

## Task 12: Dashboard Page

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `hooks/use-due-count.ts`

- [ ] **Step 12.1: Create `hooks/use-due-count.ts`**

```typescript
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useDueCount(deckId: string) {
  const { data, error, isLoading } = useSWR(`/api/decks/${deckId}/due`, fetcher, {
    refreshInterval: 60000,
  })
  return {
    dueCount: Array.isArray(data) ? data.length : 0,
    isLoading,
    error,
  }
}
```

- [ ] **Step 12.2: Create `app/(app)/dashboard/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DeckCard from '@/components/deck-card'
import { Plus } from 'lucide-react'
import type { Deck } from '@/types'

async function getDecksDue(deckId: string, userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date().toISOString().split('T')[0]
  const { data: cards } = await supabase
    .from('cards')
    .select('id, card_reviews(next_review_date, user_id)')
    .eq('deck_id', deckId)
  if (!cards) return 0
  return cards.filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === userId)
    return !userReview || userReview.next_review_date <= today
  }).length
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const decksWithDue = await Promise.all(
    (decks ?? []).map(async (deck: Deck) => ({
      deck,
      dueCount: await getDecksDue(deck.id, user.id, supabase),
    }))
  )

  const totalDue = decksWithDue.reduce((sum, d) => sum + d.dueCount, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Decks</h1>
          {totalDue > 0 && (
            <p className="text-sm text-blue-600 mt-1 font-medium">{totalDue} cards due for review today</p>
          )}
        </div>
        <Link href="/decks/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deck
          </Button>
        </Link>
      </div>

      {decksWithDue.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium mb-2">No decks yet</p>
          <p className="text-sm mb-6">Upload a PDF to generate your first flashcard deck</p>
          <Link href="/decks/new">
            <Button>Create your first deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decksWithDue.map(({ deck, dueCount }) => (
            <DeckCard key={deck.id} deck={deck} dueCount={dueCount} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 12.3: Commit**

```bash
git add app/\(app\)/dashboard/ hooks/
git commit -m "feat: add dashboard page with due counts"
```

---

## Task 13: New Deck / Upload Page

**Files:**
- Create: `app/(app)/decks/new/page.tsx`

- [ ] **Step 13.1: Create `app/(app)/decks/new/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadZone from '@/components/upload-zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function NewDeckPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'generating' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  const isLoading = status === 'uploading' || status === 'generating'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB')
      return
    }

    setError('')
    setStatus('uploading')

    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    if (description) form.append('description', description)

    setStatus('generating')

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setStatus('error')
        return
      }
      setStatus('done')
      router.push(`/decks/${data.deck_id}`)
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a new deck</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload your study material</CardTitle>
          <CardDescription>Claude AI will generate 15–25 high-quality flashcards from your PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Deck title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 5: Cell Biology"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Class 10 Biology revision"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>PDF file</Label>
              <UploadZone
                onFileSelect={setFile}
                selectedFile={file}
                onClear={() => setFile(null)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {isLoading && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700">
                  {status === 'uploading' ? 'Uploading PDF…' : 'Claude is generating your flashcards… (this takes ~15 seconds)'}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!file || !title || isLoading}>
              {isLoading ? 'Generating…' : 'Generate flashcards'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 13.2: Commit**

```bash
git add app/\(app\)/decks/new/
git commit -m "feat: add new deck upload page with PDF drag-and-drop"
```

---

## Task 14: Deck Overview Page

**Files:**
- Create: `app/(app)/decks/[deckId]/page.tsx`

- [ ] **Step 14.1: Create `app/(app)/decks/[deckId]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Trash2 } from 'lucide-react'

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) notFound()

  const { data: cards } = await supabase
    .from('cards')
    .select('*, card_reviews(*)')
    .eq('deck_id', deckId)
    .order('position')

  const today = new Date().toISOString().split('T')[0]
  const dueCards = (cards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return !userReview || userReview.next_review_date <= today
  })

  const masteredCount = (cards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string; interval_days: number }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return userReview && userReview.interval_days >= 21
  }).length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{deck.title}</h1>
          {deck.description && <p className="text-slate-500 mt-1">{deck.description}</p>}
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 && (
            <Link href={`/decks/${deckId}/study`}>
              <Button className="gap-2">
                <Play className="h-4 w-4" />
                Study ({dueCards.length} due)
              </Button>
            </Link>
          )}
          <form action={async () => {
            'use server'
            const s = await createClient()
            await s.from('decks').delete().eq('id', deckId).eq('user_id', user.id)
            redirect('/dashboard')
          }}>
            <Button type="submit" variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{cards?.length ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Total cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{dueCards.length}</p>
            <p className="text-xs text-slate-500 mt-1">Due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-slate-500 mt-1">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {dueCards.length === 0 && (cards?.length ?? 0) > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-center">
          <p className="text-green-700 font-medium">All caught up! No cards due today.</p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">All cards</h2>
        {(cards ?? []).map((card, i) => {
          const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string; interval_days: number }>
          const userReview = reviews.find(r => r.user_id === user.id)
          const isDue = !userReview || userReview.next_review_date <= today
          const isMastered = userReview && userReview.interval_days >= 21

          return (
            <div key={card.id} className="p-4 bg-white rounded-xl border border-slate-100 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{card.question}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{card.answer}</p>
              </div>
              <div className="shrink-0">
                {isMastered ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Mastered</Badge>
                ) : isDue ? (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Due</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">
                    {userReview?.next_review_date}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 14.2: Commit**

```bash
git add app/\(app\)/decks/\[deckId\]/page.tsx
git commit -m "feat: add deck overview page with stats and card list"
```

---

## Task 15: Study Session Page

**Files:**
- Create: `app/(app)/decks/[deckId]/study/page.tsx`

- [ ] **Step 15.1: Create `app/(app)/decks/[deckId]/study/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudySession from '@/components/study-session'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const { data: allCards } = await supabase
    .from('cards')
    .select('*, card_reviews(*)')
    .eq('deck_id', deckId)
    .order('position')

  const dueCards = (allCards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return !userReview || userReview.next_review_date <= today
  })

  if (dueCards.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">✅</p>
        <h1 className="text-xl font-bold">All caught up!</h1>
        <p className="text-slate-500">No cards are due for review in this deck today.</p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="outline">Back to deck</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-700 mb-6">{deck.title}</h1>
      <StudySession cards={dueCards} deckId={deckId} />
    </div>
  )
}
```

- [ ] **Step 15.2: Commit**

```bash
git add app/\(app\)/decks/\[deckId\]/study/
git commit -m "feat: add study session page"
```

---

## Task 16: Progress Page

**Files:**
- Create: `app/(app)/progress/page.tsx`

- [ ] **Step 16.1: Create `app/(app)/progress/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgressRing from '@/components/progress-ring'
import Link from 'next/link'
import type { Deck } from '@/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const deckStats = await Promise.all(
    (decks ?? []).map(async (deck: Deck) => {
      const { data: cards } = await supabase
        .from('cards')
        .select('id, card_reviews(next_review_date, user_id, interval_days, repetitions)')
        .eq('deck_id', deck.id)

      const total = cards?.length ?? 0
      const reviewed = cards?.filter(c => {
        const reviews = c.card_reviews as Array<{ user_id: string }>
        return reviews.some(r => r.user_id === user.id)
      }).length ?? 0
      const mastered = cards?.filter(c => {
        const reviews = c.card_reviews as Array<{ user_id: string; interval_days: number }>
        return reviews.some(r => r.user_id === user.id && r.interval_days >= 21)
      }).length ?? 0
      const due = cards?.filter(c => {
        const reviews = c.card_reviews as Array<{ user_id: string; next_review_date: string }>
        const userReview = reviews.find(r => r.user_id === user.id)
        return !userReview || userReview.next_review_date <= today
      }).length ?? 0

      return { deck, total, reviewed, mastered, due, masteryPct: total > 0 ? Math.round((mastered / total) * 100) : 0 }
    })
  )

  const totalCards = deckStats.reduce((s, d) => s + d.total, 0)
  const totalMastered = deckStats.reduce((s, d) => s + d.mastered, 0)
  const totalDue = deckStats.reduce((s, d) => s + d.due, 0)
  const overallPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Your Progress</h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{totalCards}</p>
          <p className="text-sm text-slate-500 mt-1">Total cards</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{totalMastered}</p>
          <p className="text-sm text-slate-500 mt-1">Mastered</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{totalDue}</p>
          <p className="text-sm text-slate-500 mt-1">Due today</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">By deck</h2>
        {deckStats.map(({ deck, total, mastered, due, masteryPct }) => (
          <Link key={deck.id} href={`/decks/${deck.id}`}>
            <div className="bg-white rounded-xl border p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
              <ProgressRing value={masteryPct} size={64} strokeWidth={6} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{deck.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{mastered}/{total} mastered · {due} due today</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-blue-600">{masteryPct}%</p>
                <p className="text-xs text-slate-400">mastery</p>
              </div>
            </div>
          </Link>
        ))}
        {deckStats.length === 0 && (
          <p className="text-center text-slate-400 py-12">No decks yet. Create one to start tracking progress.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 16.2: Commit**

```bash
git add app/\(app\)/progress/
git commit -m "feat: add progress page with mastery overview"
```

---

## Task 17: Landing Page

**Files:**
- Update: `app/page.tsx`

- [ ] **Step 17.1: Update `app/page.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Upload any PDF',
    body: 'Textbooks, notes, revision sheets — Claude reads them and writes cards that feel like they came from a great teacher.',
  },
  {
    icon: Brain,
    title: 'AI-generated flashcards',
    body: 'Key concepts, definitions, relationships, and worked examples — not shallow bullet points.',
  },
  {
    icon: TrendingUp,
    title: 'Spaced repetition',
    body: 'The SM-2 algorithm schedules each card individually. Hard cards come back sooner. Mastered ones fade into the background.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-6 w-6 text-blue-600" />
          SmartDeck
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          Upload a PDF.<br />
          <span className="text-blue-600">Study smarter.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          SmartDeck turns any study material into AI-generated flashcards and schedules your reviews so you always know exactly what to study next.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg">
            Create your first deck — it&apos;s free
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border p-6 text-left shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 17.2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page"
```

---

## Task 18: CLAUDE.md + Final Checks

**Files:**
- Create: `CLAUDE.md`
- Verify: `.gitignore` includes `.env.local`
- Verify: No secrets in client files

- [ ] **Step 18.1: Create `CLAUDE.md`**

```markdown
# SmartDeck — Session Memory

## Project
AI-powered flashcard app built for Cuemath AI Builder Challenge Round 2.
Deadline: 2026-04-22 11:00 AM.
Deployment: Vercel + Supabase.

## What Has Been Built
- [x] Full Next.js 14 App Router scaffold (TypeScript, Tailwind, shadcn/ui, Framer Motion)
- [x] TypeScript types (`types/index.ts`)
- [x] SM-2 algorithm with unit tests (`lib/sm2.ts`, `lib/sm2.test.ts`)
- [x] Supabase schema with RLS (`supabase/schema.sql`)
- [x] Supabase browser + server clients (`lib/supabase/`)
- [x] PDF parser wrapper (`lib/pdf-parser.ts`)
- [x] Claude API wrapper — server-side only (`lib/claude.ts`)
- [x] Auth middleware (`middleware.ts`)
- [x] Login + signup pages (`app/(auth)/`)
- [x] App layout + sidebar nav (`app/(app)/layout.tsx`, `components/nav.tsx`)
- [x] API routes: deck CRUD, due cards, generate, reviews
- [x] Flashcard flip component with Framer Motion (`components/flashcard.tsx`)
- [x] Study session orchestrator (`components/study-session.tsx`)
- [x] Upload zone component (`components/upload-zone.tsx`)
- [x] Deck card component (`components/deck-card.tsx`)
- [x] Progress ring SVG component (`components/progress-ring.tsx`)
- [x] Dashboard page with due counts
- [x] New deck / upload page
- [x] Deck overview page with stats and card list
- [x] Study session page (SM-2 driven)
- [x] Progress page (mastery overview per deck)
- [x] Landing page

## What Is In Progress
Nothing — build complete. Pending: deployment.

## What Still Needs To Be Done
- [ ] Deploy to Vercel (push repo, set env vars, verify live)

## Key Decisions
- Private decks only — no sharing
- SM-2 quality mapped to 4 buttons: Forgot(1) / Hard(3) / Good(4) / Easy(5)
- PDF text truncated to 15,000 chars before Claude call
- card_reviews rows created lazily on first review (not at card creation)
- Scanned PDFs (<100 chars extracted) fail with a clear user-facing error
- Claude key + Supabase service role key: server-side only, never in client code

## Security Checklist
- [x] .env.local in .gitignore
- [x] ANTHROPIC_API_KEY only in lib/claude.ts (API route only)
- [x] SUPABASE_SERVICE_ROLE_KEY not used client-side
- [x] RLS enabled on all tables
- [x] API routes verify auth.uid() on every call
- [x] File type + size validated client + server

## Local Dev
\`\`\`bash
npm install
npm run dev       # http://localhost:3000
npm test          # run SM-2 unit tests
\`\`\`

## Required .env.local
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
\`\`\`

## Deployment
1. Push repo to GitHub
2. Import into Vercel → set all 4 env vars in dashboard
3. Deploy
4. Run supabase/schema.sql in Supabase SQL Editor if not done
5. Test: signup → upload PDF → study session → progress page
```

- [ ] **Step 18.2: Verify `.gitignore` contains `.env.local`**

Run: `grep -n "env.local" .gitignore`
Expected: a line containing `.env.local`

- [ ] **Step 18.3: Security scan — verify no secrets in client files**

Run: `grep -r "ANTHROPIC\|sk-ant\|service_role" app/\(app\)/ app/\(auth\)/ components/ hooks/ 2>/dev/null`
Expected: no output

- [ ] **Step 18.4: Type check**

```bash
npm run type-check 2>/dev/null || npx tsc --noEmit
```

Expected: no errors (or only minor shadcn auto-import warnings)

- [ ] **Step 18.5: Run tests**

```bash
npm test
```

Expected: 8 SM-2 tests pass.

- [ ] **Step 18.6: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md session memory and verify security checklist"
```

---

## Task 19: Deploy to Vercel

- [ ] **Step 19.1: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

- [ ] **Step 19.2: Import project on Vercel**

1. Go to vercel.com → New Project → import your GitHub repo
2. Framework: Next.js (auto-detected)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy

- [ ] **Step 19.3: Verify live app end-to-end**

1. Open live Vercel URL
2. Sign up with a new email
3. Confirm email (check inbox)
4. Upload a PDF → wait for cards to generate
5. Click "Study" → flip cards → rate each one
6. Check Progress page — mastery should reflect reviews
7. Revisit deck — some cards should show future review dates

---

## Self-Review Against Spec

| Spec Requirement | Covered In |
|---|---|
| PDF upload + Claude card generation | Task 8 (generate API), Task 13 (upload page) |
| SM-2 algorithm (ease, interval, repetitions) | Task 2 (sm2.ts + tests), Task 9 (reviews API) |
| Study session with flip animation | Task 10 (flashcard + study-session components) |
| 4 rating buttons (Forgot/Hard/Good/Easy) | Task 10, flashcard.tsx |
| Due-today scheduling | Task 7 (due API route), Tasks 12, 14, 15 |
| Dashboard with due counts | Task 12 |
| Deck management (create, view, delete) | Tasks 7, 13, 14 |
| Progress / mastery overview | Task 16 |
| Auth (login, signup, protected routes) | Tasks 5, 6, middleware |
| RLS on all tables | Task 3 (schema.sql) |
| API key never in client code | lib/claude.ts (server only), Task 18 scan |
| Scanned PDF detection | Task 8 (isTextExtractable check) |
| 10MB file limit | Task 8 (server + client check) |
| CLAUDE.md session memory | Task 18 |
| Deployed on Vercel | Task 19 |
| Private decks only | All deck queries filter by user_id |
