import React, { useState } from 'react'
import { NAME_KEY } from '../utils'

export default function NameScreen({ onSave }) {
  const [name, setName] = useState('')
  const save = () => { if (!name.trim()) return; localStorage.setItem(NAME_KEY, name.trim()); onSave(name.trim()) }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16, padding:'2rem' }}>
      <i className="ti ti-sword" aria-hidden="true" style={{ fontSize:40, opacity:0.25 }} />
      <h2 style={{ fontSize:20, fontWeight:500 }}>Eternal Hero QA</h2>
      <p style={{ fontSize:14, color:'var(--text2)' }}>Enter your name to join</p>
      <input type="text" placeholder="Your name" maxLength={30} value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        style={{ width:240, textAlign:'center' }} autoFocus />
      <button className="btn" onClick={save}>Join session</button>
    </div>
  )
}
