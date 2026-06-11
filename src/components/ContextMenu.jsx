import React, { useEffect, useRef } from 'react'

export default function ContextMenu({ items, onClose, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', zIndex: 200, background: 'var(--bg)', border: '0.5px solid var(--border2)',
      borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, overflow: 'hidden', ...style
    }}>
      {items.map((item, i) => item === 'divider' ? (
        <div key={i} style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
      ) : (
        <button key={i} onClick={() => { item.onClick(); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
            fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            color: item.danger ? '#A32D2D' : 'var(--text)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <i className={`ti ${item.icon}`} aria-hidden="true" style={{ fontSize: 14 }} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
