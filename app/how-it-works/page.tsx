export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #3f3f46', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6366f1' }}>📖</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>SmartDeck</span>
        </div>
        <a href="/login" style={{ padding: '8px 16px', background: '#6366f1', color: '#fafafa', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>Sign in</a>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Study smarter, not harder
        </h1>
        <p style={{ fontSize: 20, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32 }}>
          SmartDeck uses AI and cognitive science to help you remember everything you learn
        </p>
        <a href="/signup" style={{ display: 'inline-block', padding: '14px 32px', background: '#6366f1', color: '#fafafa', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}>
          Get started free
        </a>
      </section>

      {/* 3 Steps */}
      <section style={{ padding: '0 32px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 40 }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { icon: '📄', title: 'Upload any PDF', desc: 'Drop in a textbook chapter, class notes, or any study material. Text-based PDFs work best.' },
            { icon: '🧠', title: 'AI generates your deck', desc: 'Our AI reads your PDF and writes flashcards like an expert teacher — real questions that test understanding, not shallow bullets.' },
            { icon: '📊', title: 'Study with spaced repetition', desc: 'The SM-2 algorithm tracks what you know and shows you each card at exactly the right time — study less, remember more.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: 14 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Science section */}
      <section style={{ background: '#18181b', borderTop: '1px solid #3f3f46', borderBottom: '1px solid #3f3f46', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Why spaced repetition works</h2>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 12 }}>
              Hermann Ebbinghaus discovered that without reviewing, you forget 70% of new information within 24 hours. This is the &ldquo;forgetting curve.&rdquo;
            </p>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
              SmartDeck fights this by showing you each card right before you would forget it — reinforcing memory at the exact moment it needs it.
            </p>
          </div>
          <div>
            <svg viewBox="0 0 300 160" style={{ width: '100%', background: '#27272a', borderRadius: 12, padding: 16 }}>
              <text x="10" y="20" fill="#71717a" fontSize="11">Memory retention</text>
              <path d="M 20 30 Q 60 32 100 70 Q 140 110 280 140" stroke="#ef4444" strokeWidth="2" fill="none"/>
              <path d="M 100 70 Q 130 50 160 60 Q 200 75 220 110 Q 240 125 280 130" stroke="#6366f1" strokeWidth="2" fill="none" strokeDasharray="4"/>
              <text x="106" y="56" fill="#6366f1" fontSize="9">review</text>
              <text x="10" y="155" fill="#71717a" fontSize="9">Time →</text>
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 32px', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 40, textAlign: 'center' }}>FAQ</h2>
        {[
          { q: 'Is it free?', a: 'Yes, completely free during this period.' },
          { q: 'What types of PDFs work?', a: 'Text-based PDFs work best. Scanned image PDFs are not supported yet.' },
          { q: 'How long until I master something?', a: 'Typically 5–7 correct reviews over 2–3 weeks, depending on difficulty.' },
          { q: 'Can I edit generated cards?', a: 'Card editing is coming soon. For now, you can delete a deck and re-upload.' },
        ].map(({ q, a }) => (
          <div key={q} style={{ borderBottom: '1px solid #3f3f46', padding: '20px 0' }}>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{q}</h3>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>{a}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
