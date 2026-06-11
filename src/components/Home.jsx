import React from 'react'
import { useNavigate } from 'react-router-dom'
import { pillCls, timeAgo } from '../utils'

export default function Home({ patches, testerName, onChangeName }) {
  const nav = useNavigate()
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderBottom:'0.5px solid var(--border)', background:'var(--bg)' }}>
        <i className="ti ti-sword" aria-hidden="true" style={{ fontSize:17 }} />
        <span style={{ fontSize:14, fontWeight:500, flex:1 }}>Eternal Hero QA</span>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text2)', cursor:'pointer', padding:'3px 7px', borderRadius:8, border:'0.5px solid var(--border)' }} onClick={onChangeName}>
          {testerName}
        </div>
      </div>
      <div style={{ padding:'1.25rem' }}>
        <h1 style={{ fontSize:17, fontWeight:500, marginBottom:'1.25rem' }}>Patch sessions</h1>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {patches.filter(p => p.status !== 'draft').length === 0 && (
            <div style={{ padding:'2rem', textAlign:'center', fontSize:13, color:'var(--text2)' }}>No active patches to join yet.</div>
          )}
          {patches.filter(p => p.status !== 'draft').map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, cursor:'pointer' }}
              onClick={() => nav(`/patch/${p.id}`)}>
              <i className="ti ti-file-description" aria-hidden="true" style={{ fontSize:18, color:'var(--text2)' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{p.title} {p.version && <span style={{ fontSize:11, color:'var(--text2)' }}>{p.version}</span>}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2, display:'flex', gap:8 }}>
                  <span>{p.changes.length} changes</span>
                  <span>{p.changes.filter(c=>c.status==='pass').length} passed · {p.changes.filter(c=>c.status==='fail').length} failed</span>
                  <span>Created {timeAgo(p.created)}</span>
                </div>
              </div>
              <span className={`pill ${pillCls(p.status)}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
