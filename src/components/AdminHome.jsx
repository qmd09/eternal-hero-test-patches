import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uid, pillCls, timeAgo } from '../utils'

export default function AdminHome({ patches, onSave, testerName, onChangeName }) {
  const nav = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')

  const create = async () => {
    if (!title.trim()) return
    const np = { id: 'patch-' + uid(), title: title.trim(), version: version.trim(), status: 'draft', created: Date.now(), changes: [] }
    const updated = [np, ...patches]
    await onSave(updated)
    setShowModal(false); setTitle(''); setVersion('')
    nav(`/admin/patch/${np.id}`)
  }

  const del = async (id) => {
    if (!confirm('Delete this patch session?')) return
    await onSave(patches.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderBottom:'0.5px solid var(--border)', background:'var(--bg)' }}>
        <i className="ti ti-sword" aria-hidden="true" style={{ fontSize:17 }} />
        <span style={{ fontSize:14, fontWeight:500, flex:1 }}>Eternal Hero QA — Admin</span>
        <span className="badge badge-ai" style={{ background:'#FAEEDA', color:'#633806' }}>admin</span>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text2)', cursor:'pointer', padding:'3px 7px', borderRadius:8, border:'0.5px solid var(--border)' }} onClick={onChangeName}>
          {testerName}
        </div>
      </div>

      <div style={{ padding:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h1 style={{ fontSize:17, fontWeight:500 }}>Patch sessions</h1>
          <button className="btn" onClick={() => setShowModal(true)}><i className="ti ti-plus" aria-hidden="true" /> New patch</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {patches.length === 0 && <div style={{ padding:'2rem', textAlign:'center', fontSize:13, color:'var(--text2)' }}>No patches yet — create one to get started</div>}
          {patches.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, cursor:'pointer' }}
              onClick={() => nav(`/admin/patch/${p.id}`)}>
              <i className="ti ti-file-description" aria-hidden="true" style={{ fontSize:18, color:'var(--text2)' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{p.title} {p.version && <span style={{ fontSize:11, color:'var(--text2)' }}>{p.version}</span>}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2, display:'flex', gap:8 }}>
                  <span>{p.changes.length} changes</span>
                  <span>{p.changes.reduce((a, c) => a + (c.subs?.length || 0), 0)} sub-topics</span>
                  <span>{p.changes.filter(c => c.status === 'pass').length} passed · {p.changes.filter(c => c.status === 'fail').length} failed</span>
                  <span>Created {timeAgo(p.created)}</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }} onClick={e => e.stopPropagation()}>
                <span className={`pill ${pillCls(p.status)}`}>{p.status}</span>
                <button className="btn" onClick={() => nav(`/admin/patch/${p.id}`)}><i className="ti ti-edit" aria-hidden="true" /> Edit</button>
                <button className="icon-btn" onClick={() => del(p.id)}><i className="ti ti-trash" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg)', border:'0.5px solid var(--border2)', borderRadius:12, padding:'1.25rem', width:340 }}>
            <h2 style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>New patch session</h2>
            <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Create a testing session for your team.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
              <label style={{ fontSize:12, color:'var(--text2)' }}>Patch title</label>
              <input type="text" placeholder="e.g. Eternal Hero — Patch v1.4" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} autoFocus />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
              <label style={{ fontSize:12, color:'var(--text2)' }}>Version tag (optional)</label>
              <input type="text" placeholder="v1.4" value={version} onChange={e => setVersion(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:7, justifyContent:'flex-end', marginTop:14 }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" onClick={create}><i className="ti ti-plus" aria-hidden="true" /> Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
