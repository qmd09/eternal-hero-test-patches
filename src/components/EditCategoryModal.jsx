import React, { useState } from 'react'

const CATEGORIES = ['mastery', 'balance', 'item', 'bugfix', 'other']

export default function EditCategoryModal({ category, onSave, onCancel }) {
  const [title, setTitle] = useState(category.title || '')
  const [cat, setCat] = useState(category.category || 'other')
  const [description, setDescription] = useState(category.description || '')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), category: cat, description: description.trim() })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: '1.25rem', width: 380 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Edit category</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)' }}>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
            placeholder="Category title" autoFocus />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)' }}>Type</label>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ fontSize: 13, padding: '7px 9px' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)' }}>Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief summary of this change" style={{ height: 70, fontSize: 13 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={handleSave} disabled={!title.trim()}>Save</button>
        </div>
      </div>
    </div>
  )
}
