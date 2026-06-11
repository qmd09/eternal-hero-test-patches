import React, { useState } from 'react'

export default function DeleteConfirmModal({ authorName, onConfirm, onCancel }) {
  const [step, setStep] = useState(1) // 1 = are you sure, 2 = type to confirm
  const [typed, setTyped] = useState('')
  const expected = `${authorName} delete this`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: '1.25rem', width: 340 }} onClick={e => e.stopPropagation()}>
        {step === 1 ? (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Delete this item?</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
              This will soft-delete the item. Privileged users can restore it within 30 days, after which it's permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onCancel}>Cancel</button>
              <button className="btn" onClick={() => setStep(2)}
                style={{ background: '#FCEBEB', color: '#A32D2D', borderColor: '#F7C1C1' }}>
                Yes, delete
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Confirm deletion</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
              Type <span style={{ fontFamily: 'monospace', background: 'var(--bg2)', padding: '1px 5px', borderRadius: 4 }}>{expected}</span> to confirm.
            </p>
            <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
              placeholder={expected}
              onKeyDown={e => { if (e.key === 'Enter' && typed === expected) onConfirm(); if (e.key === 'Escape') onCancel() }}
              style={{ width: '100%', marginBottom: 12 }} autoFocus />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onCancel}>Cancel</button>
              <button className="btn" onClick={onConfirm} disabled={typed !== expected}
                style={{ background: typed === expected ? '#FCEBEB' : 'var(--bg2)', color: typed === expected ? '#A32D2D' : 'var(--text3)', borderColor: typed === expected ? '#F7C1C1' : 'var(--border)' }}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
