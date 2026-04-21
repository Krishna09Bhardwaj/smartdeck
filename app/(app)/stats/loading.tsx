export default function StatsLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ height: 36, width: 200, background: '#1e1e24', borderRadius: 8, marginBottom: 32, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 100, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <div style={{ height: 220, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, marginBottom: 32, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 300, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
