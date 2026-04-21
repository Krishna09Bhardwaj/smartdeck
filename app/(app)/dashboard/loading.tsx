export default function DashboardLoading() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ height: 32, width: 200, background: '#27272a', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 90, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 200, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
