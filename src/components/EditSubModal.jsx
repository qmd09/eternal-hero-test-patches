import React, { useState } from 'react'
import { subTitle } from '../utils'

export default function EditSubModal({ sub, onSave, onCancel }) {
  const [where, setWhere] = useState(sub.where || '')
  const [what, setWhat] = useState(sub.what || '')

  const handleSave = () => {
    if (!where.trim() || !what.trim()) return
    onSave(where.trim(), what.trim())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: '1.25rem', width: 380 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Edit sub-topic</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)' }}>WHERE</label>
            <input type="text" value={where} onChange={e => setWhere(e.target.value)} placeholder="Skill 1, UI, Misc..." autoFocus />
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)' }}>WHAT</label>
            <input type="text" value={what} onChange={e => setWhat(e.target.value)} placeholder="Description of issue"
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }} />
          </div>
        </div>
        {where && what && (
          <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, padding: '6px 8px', background: 'var(--bg2)', borderRadius: 6 }}>
            {subTitle(where, what)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={handleSave} disabled={!where.trim() || !what.trim()}>Save</button>
        </div>
      </div>
    </div>
  )
}
