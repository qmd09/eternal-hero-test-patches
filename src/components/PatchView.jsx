import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uid, subTitle, pillCls, generateChangesFromNotes, isPrivileged } from '../utils'
import { getBulkLastRead, countUnread } from '../readState'
import Sidebar from './Sidebar'
import Panel from './Panel'

export default function PatchView({ patch, patches, onSave, testerName, onChangeName, isAdmin }) {
  const nav = useNavigate()
  const [selId, setSelId] = useState(patch?.changes?.find(c => !c.deleted)?.id || null)
  const [selType, setSelType] = useState(patch?.changes?.find(c => !c.deleted) ? 'change' : null)
  const [generating, setGenerating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editTitle, setEditTitle] = useState(patch?.title || '')
  const [editVersion, setEditVersion] = useState(patch?.version || '')
  const priv = isPrivileged(testerName)
  const [readMap, setReadMap] = React.useState({})

  if (!patch) return <div style={{ padding: '2rem', color: 'var(--text2)' }}>Patch not found.</div>

  // Collect all topic IDs (changes + subs)
  useEffect(() => {
    if (!testerName || !patch) return
    const ids = patch.changes.flatMap(c => [c.id, ...(c.subs || []).map(s => s.id)])
    getBulkLastRead(testerName, ids).then(map => setReadMap(map))
  }, [testerName, patch?.id])

  const updatePatch = async (updated) => {
    await onSave(patches.map(p => p.id === updated.id ? updated : p))
  }

  const getSelected = () => {
    if (selType === 'change') return patch.changes.find(c => c.id === selId) || null
    if (selType === 'sub') { for (const c of patch.changes) { const s = c.subs?.find(s => s.id === selId); if (s) return s } }
    return null
  }

  const getParentChange = () => {
    if (selType !== 'sub') return null
    for (const c of patch.changes) { if (c.subs?.find(s => s.id === selId)) return c }
    return null
  }

  const mapComments = (comments, id, fn) => (comments || []).map(cm => {
    if (cm.id === id) return fn(cm)
    if (cm.replies?.length) return { ...cm, replies: mapComments(cm.replies, id, fn) }
    return cm
  })

  const softDeleteComment = (comments, id, name) => (comments || []).map(cm => {
    if (cm.id === id) return { ...cm, deleted: true, deletedAt: Date.now(), deletedBy: name }
    if (cm.replies?.length) return { ...cm, replies: softDeleteComment(cm.replies, id, name) }
    return cm
  })

  const withUpdatedComments = (comments, tags) => {
    if (selType === 'change') return { ...patch, changes: patch.changes.map(c => c.id === selId ? { ...c, comments, ...(tags !== undefined ? { tags } : {}) } : c) }
    return { ...patch, changes: patch.changes.map(c => ({ ...c, subs: (c.subs || []).map(s => s.id === selId ? { ...s, comments, ...(tags !== undefined ? { tags } : {}) } : s) })) }
  }

  const handleAddChange = async (title) => {
    const nc = { id: 'c' + uid(), title, category: 'other', description: '', status: 'none', deleted: false, subs: [], comments: [] }
    await updatePatch({ ...patch, changes: [...patch.changes, nc] })
    setSelId(nc.id); setSelType('change')
  }

  const handleAddSub = async (changeId, where, what) => {
    const ns = { id: 's' + uid(), title: subTitle(where, what), where, what, status: 'none', deleted: false, comments: [] }
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === changeId ? { ...c, subs: [...(c.subs || []), ns].sort((a, b) => a.title.localeCompare(b.title)) } : c) })
    setSelId(ns.id); setSelType('sub')
  }

  const handleEditSub = async (changeId, subId, where, what) => {
    const title = subTitle(where, what)
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === changeId ? { ...c, subs: (c.subs || []).map(s => s.id === subId ? { ...s, title, where, what } : s) } : c) })
  }

  const handleEditCategory = async (id, updates) => {
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === id ? { ...c, ...updates } : c) })
  }

  const handleDeleteCategory = async (id) => {
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === id ? { ...c, deleted: true, deletedAt: Date.now(), deletedBy: testerName } : c) })
    if (selId === id) { const next = patch.changes.find(c => c.id !== id && !c.deleted); setSelId(next?.id || null); setSelType(next ? 'change' : null) }
  }

  const handleRestoreCategory = async (id) => {
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === id ? { ...c, deleted: false, deletedAt: null, deletedBy: null } : c) })
  }

  const handleDeleteSub = async (changeId, subId) => {
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === changeId ? { ...c, subs: (c.subs || []).map(s => s.id === subId ? { ...s, deleted: true, deletedAt: Date.now(), deletedBy: testerName } : s) } : c) })
    if (selId === subId) { setSelId(changeId); setSelType('change') }
  }

  const handleRestoreSub = async (changeId, subId) => {
    await updatePatch({ ...patch, changes: patch.changes.map(c => c.id === changeId ? { ...c, subs: (c.subs || []).map(s => s.id === subId ? { ...s, deleted: false, deletedAt: null, deletedBy: null } : s) } : c) })
  }

  const handleStatusChange = async (status) => {
    const sel = getSelected(); if (!sel) return
    const newStatus = sel.status === status ? 'none' : status
    await updatePatch({ ...patch, changes: patch.changes.map(c => {
      if (selType === 'change' && c.id === selId) return { ...c, status: newStatus }
      if (selType === 'sub') return { ...c, subs: (c.subs || []).map(s => s.id === selId ? { ...s, status: newStatus } : s) }
      return c
    })})
  }

  const handlePostComment = async (comment) => {
    const sel = getSelected(); if (!sel) return
    await updatePatch(withUpdatedComments([...(sel.comments || []), comment]))
  }

  const handleEditComment = async (cmId, newText) => {
    const sel = getSelected(); if (!sel) return
    await updatePatch(withUpdatedComments(mapComments(sel.comments, cmId, cm => ({ ...cm, text: newText, edited: true }))))
  }

  const handleDeleteComment = async (cmId) => {
    if (cmId === '__item__') return
    const sel = getSelected(); if (!sel) return
    await updatePatch(withUpdatedComments(softDeleteComment(sel.comments, cmId, testerName)))
  }

  const handleReplyComment = async (parentId, replyText) => {
    const sel = getSelected(); if (!sel) return
    const reply = { id: 'cm' + uid(), author: testerName, aType: 'tester', text: replyText, ts: Date.now(), media: [], replies: [], deleted: false }
    await updatePatch(withUpdatedComments(mapComments(sel.comments, parentId, cm => ({ ...cm, replies: [...(cm.replies || []), reply] }))))
  }

  const handleToggleReaction = async (cmId, emoji) => {
    const sel = getSelected(); if (!sel) return
    const toggle = (comments) => (comments || []).map(cm => {
      if (cm.id === cmId) {
        const current = (cm.reactions || {})[emoji] || []
        const updated = current.includes(testerName) ? current.filter(n => n !== testerName) : [...current, testerName]
        return { ...cm, reactions: { ...(cm.reactions || {}), [emoji]: updated } }
      }
      if (cm.replies?.length) return { ...cm, replies: toggle(cm.replies) }
      return cm
    })
    await updatePatch(withUpdatedComments(toggle(sel.comments)))
  }

  const handleSetTag = async (cmId, tag) => {
    const sel = getSelected(); if (!sel) return
    const update = (comments) => (comments || []).map(cm => {
      if (cm.id === cmId) return { ...cm, tag: tag || null }
      if (cm.replies?.length) return { ...cm, replies: update(cm.replies) }
      return cm
    })
    await updatePatch(withUpdatedComments(update(sel.comments)))
  }

  const handleAddTag = async (tag) => {
    const sel = getSelected(); if (!sel) return
    const existing = sel.tags || []
    if (existing.includes(tag)) return
    await updatePatch(withUpdatedComments(sel.comments, [...existing, tag]))
  }

  const handleGenerate = async (raw) => {
    if (!raw.trim() || generating) return
    setGenerating(true)
    try {
      const parsed = await generateChangesFromNotes(raw)
      await updatePatch({ ...patch, changes: [...patch.changes, ...parsed], status: patch.status === 'draft' ? 'active' : patch.status })
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const handleSaveEdit = async () => {
    await updatePatch({ ...patch, title: editTitle.trim() || patch.title, version: editVersion.trim() })
    setShowEdit(false)
  }

  const copyLink = () => { navigator.clipboard?.writeText(`${window.location.origin}/patch/${patch.id}`).catch(() => {}); alert('Link copied!') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <i className="ti ti-sword" aria-hidden="true" style={{ fontSize: 17 }} />
        <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
          <span style={{ color: 'var(--text2)', cursor: 'pointer' }} onClick={() => nav(isAdmin ? '/admin' : '/')}>Patches</span>
          <span style={{ opacity: 0.35, margin: '0 5px' }}>/</span>
          <span>{patch.title}</span>
        </span>
        {isAdmin && <span className="badge" style={{ background: '#FAEEDA', color: '#633806' }}>admin</span>}
        {priv && !isAdmin && <span className="badge badge-ai">privileged</span>}
        <button className="btn" style={{ fontSize:12 }} onClick={() => nav(isAdmin ? `/admin/patch/${patch.id}/damage` : `/patch/${patch.id}/damage`)}>
          <i className="ti ti-chart-bar" aria-hidden="true" /> Damage Report
        </button>
        <button className="icon-btn" onClick={() => window.location.reload()} title="Refresh"><i className="ti ti-refresh" aria-hidden="true" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', padding: '3px 7px', borderRadius: 8, border: '0.5px solid var(--border)' }} onClick={onChangeName}>
          {testerName}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, flex: 1, minWidth: 0 }}>
          <i className="ti ti-link" aria-hidden="true" style={{ fontSize: 13, color: 'var(--text2)' }} />
          <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{window.location.origin}/patch/{patch.id}</span>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={copyLink}>Copy</button>
        </div>
        {isAdmin ? (
          <>
            <select defaultValue={patch.status} onChange={e => updatePatch({ ...patch, status: e.target.value })} style={{ fontSize: 12, padding: '5px 8px' }}>
              {['draft', 'active', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn" onClick={() => setShowEdit(true)}><i className="ti ti-edit" aria-hidden="true" /> Edit</button>
          </>
        ) : <span className={`pill ${pillCls(patch.status)}`}>{patch.status}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: '1fr', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar patch={patch} selId={selId} selType={selType}
          onSelect={(id, type) => { setSelId(id); setSelType(type) }}
          onAddChange={handleAddChange} onAddSub={handleAddSub} onEditCategory={handleEditCategory}
          readMap={readMap}
          onEditSub={handleEditSub} onDeleteCategory={handleDeleteCategory} onDeleteSub={handleDeleteSub}
          onRestoreCategory={handleRestoreCategory} onRestoreSub={handleRestoreSub}
          isAdmin={isAdmin} generating={generating} onGenerate={handleGenerate}
          testerName={testerName} />
        <Panel sel={getSelected()} selType={selType} parentChange={getParentChange()}
          testerName={testerName} isAdmin={isAdmin}
          onStatusChange={handleStatusChange} onPostComment={handlePostComment}
          onEditComment={handleEditComment} onDeleteComment={handleDeleteComment}
          onReplyComment={handleReplyComment} onToggleReaction={handleToggleReaction}
          onSetTag={handleSetTag} onAddTag={handleAddTag}
          topicId={selId}
          lastRead={readMap[selId] || 0}
          onMarkRead={(id) => setReadMap(prev => ({ ...prev, [id]: Date.now() }))} />
      </div>

      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: '1.25rem', width: 340 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Edit patch</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)' }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)' }}>Version</label>
              <input value={editVersion} onChange={e => setEditVersion(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
