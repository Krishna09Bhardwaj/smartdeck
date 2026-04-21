export default function DeckLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ height: 14, width: 100, background: '#1e1e24', borderRadius: 6, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 36, width: 320, background: '#1e1e24', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 16, width: 200, background: '#1e1e24', borderRadius: 6, marginBottom: 28, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <div style={{ height: 120, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ height: 72, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 12, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
