import React, { useState, useRef, useCallback } from 'react'
import { catIcon, dotCls, subTitle, uid, isPrivileged } from '../utils'
import DeleteConfirmModal from './DeleteConfirmModal'
import { countUnread, countAll } from '../readState'
import EditSubModal from './EditSubModal'
import EditCategoryModal from './EditCategoryModal'
import ContextMenu from './ContextMenu'
import FilterDropdown from './FilterDropdown'

export default function Sidebar({ patch, selId, selType, onSelect, onAddChange, onAddSub, onEditSub, onEditCategory, onDeleteCategory, onDeleteSub, onRestoreCategory, onRestoreSub, isAdmin, generating, onGenerate, testerName, readMap = {} }) {
  const [filterStatuses, setFilterStatuses] = useState(['all'])
  const [filterVisibility, setFilterVisibility] = useState('active')
  const [sortBy, setSortBy] = useState('name')
  const [addingChange, setAddingChange] = useState(false)
  const [newChangeText, setNewChangeText] = useState('')
  const [addingSubFor, setAddingSubFor] = useState(null)
  const [subWhere, setSubWhere] = useState('')
  const [subWhat, setSubWhat] = useState('')
  const [aiNotes, setAiNotes] = useState('')
  const [width, setWidth] = useState(260)
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editSubTarget, setEditSubTarget] = useState(null) // {sub, changeId}
  const [editCategoryTarget, setEditCategoryTarget] = useState(null) // category object
  const [openMenu, setOpenMenu] = useState(null) // {id, type, x, y, changeId?}
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)
  const priv = isPrivileged(testerName)

  const EXAMPLE = `Fixed Glaciron pillar spawn when stunned.\nFixed Active Skill buttons disappearing.\nMastery Update: Two-handed, Dual Swords`

  const onMouseDown = useCallback((e) => {
    dragging.current = true; startX.current = e.clientX; startW.current = width
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    const onMove = (e) => { if (!dragging.current) return; setWidth(Math.min(520, Math.max(180, startW.current + e.clientX - startX.current))) }
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [width])

  const toggleCollapse = (id) => setCollapsedCategories(p => ({ ...p, [id]: !p[id] }))

  const showDeleted = priv && filterVisibility === 'deleted'

  let changes = showDeleted
    ? (patch?.changes || []).filter(c => c.deleted || (c.subs || []).some(s => s.deleted))
    : (patch?.changes || []).filter(c => !c.deleted)
  if (!filterStatuses.includes('all')) changes = changes.filter(c => filterStatuses.includes(c.status))
  if (sortBy === 'name') changes.sort((a, b) => a.title.localeCompare(b.title))
  else if (sortBy === 'status') { const o = { fail: 0, prog: 1, none: 2, pass: 3 }; changes.sort((a, b) => (o[a.status || 'none'] || 2) - (o[b.status || 'none'] || 2)) }

  const handleAddChange = () => { if (!newChangeText.trim()) return; onAddChange(newChangeText.trim()); setNewChangeText(''); setAddingChange(false) }
  const handleAddSub = (changeId) => { if (!subWhere.trim() || !subWhat.trim()) return; onAddSub(changeId, subWhere.trim(), subWhat.trim()); setSubWhere(''); setSubWhat(''); setAddingSubFor(null) }
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'category') onDeleteCategory(deleteTarget.id)
    else onDeleteSub(deleteTarget.changeId, deleteTarget.id)
    setDeleteTarget(null)
  }

  const openCtxMenu = (e, config) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    // position relative to sidebar
    const sidebarEl = e.currentTarget.closest('[data-sidebar]')
    const sidebarRect = sidebarEl?.getBoundingClientRect() || { left: 0, top: 0 }
    setOpenMenu({ ...config, x: rect.right - sidebarRect.left - 130, y: rect.bottom - sidebarRect.top + 2 })
  }

  const categoryMenuItems = (c) => {
    const items = []
    if (!c.deleted) {
      items.push({ label: 'Edit', icon: 'ti-pencil', onClick: () => setEditCategoryTarget(c) })
      if (priv || isAdmin) {
        items.push('divider')
        items.push({ label: 'Delete', icon: 'ti-trash', danger: true, onClick: () => setDeleteTarget({ type: 'category', id: c.id }) })
      }
    } else if (priv) {
      items.push({ label: 'Restore', icon: 'ti-refresh', onClick: () => onRestoreCategory(c.id) })
    }
    return items
  }

  const subMenuItems = (s, changeId) => {
    const items = []
    if (!s.deleted) {
      items.push({ label: 'Edit', icon: 'ti-pencil', onClick: () => setEditSubTarget({ sub: s, changeId }) })
      items.push('divider')
      items.push({ label: 'Delete', icon: 'ti-trash', danger: true, onClick: () => setDeleteTarget({ type: 'sub', id: s.id, changeId }) })
    } else if (priv) {
      items.push({ label: 'Restore', icon: 'ti-refresh', onClick: () => onRestoreSub(changeId, s.id) })
    }
    return items
  }

  return (
    <div data-sidebar style={{ width, minWidth: 180, maxWidth: 520, display: 'flex', flexDirection: 'row', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          Categories ({changes.length})
        </div>

        {/* filter + sort bar */}
        <div style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--border)', flexShrink: 0, display: 'flex', gap: 5, alignItems: 'center' }}>
          <FilterDropdown
            filterStatuses={filterStatuses} setFilterStatuses={setFilterStatuses}
            filterVisibility={filterVisibility} setFilterVisibility={setFilterVisibility}
            isPrivileged={priv} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 11, padding: '4px 6px', flex: 1 }}>
            <option value="name">Sort A → Z</option>
            <option value="status">Sort by status</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}>
          {changes.length === 0 && <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--text2)' }}>No categories</div>}
          {changes.map(c => {
            const isCollapsed = collapsedCategories[c.id]
            const activeSubs = (c.subs || []).filter(s => showDeleted ? s.deleted : !s.deleted)
            const catMenuItems = categoryMenuItems(c)

            return (
              <React.Fragment key={c.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 8px 7px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 500, borderLeft: selType === 'change' && selId === c.id ? '2px solid #378ADD' : '2px solid transparent', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', background: selType === 'change' && selId === c.id ? '#1e3a5f' : c.deleted ? 'rgba(226,75,74,0.06)' : 'var(--bg3)', color: selType === 'change' && selId === c.id ? '#ffffff' : 'var(--text)', opacity: c.deleted ? 0.65 : 1 }}>
                  <button onClick={() => toggleCollapse(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text2)', fontSize: 11, marginTop: 3, flexShrink: 0 }}>
                    <i className={`ti ${isCollapsed ? 'ti-chevron-right' : 'ti-chevron-down'}`} aria-hidden="true" />
                  </button>
                  <span className={`dot ${dotCls(c.status)}`} style={{ marginTop: 5, flexShrink: 0 }} />
                  <i className={`ti ${catIcon(c.category)}`} aria-hidden="true" style={{ fontSize: 13, color: 'var(--text2)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: 1.4, textDecoration: c.deleted ? 'line-through' : 'none' }}
                    onClick={() => (priv || !c.deleted) && onSelect(c.id, 'change')}>{c.title}</span>
              {(() => {
                const total = countAll(c.comments)
                const unread = countUnread(c.comments, readMap[c.id])
                return (<>
                  {total > 0 && <span style={{ fontSize: 10, color: 'var(--text2)', display:'flex', alignItems:'center', gap:2, flexShrink:0, marginRight:2 }}>
                    <i className="ti ti-message-circle" aria-hidden="true" style={{fontSize:10}} /> {total}
                  </span>}
                  {unread > 0 && <span style={{ fontSize: 10, fontWeight:600, color:'white', background:'#378ADD', borderRadius:20, padding:'1px 6px', flexShrink:0, marginRight:2 }}>{unread}</span>}
                </>)
              })()}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>
                    {!c.deleted && (
                      <button className="icon-btn" style={{ padding: '1px 5px', fontSize: 11 }} title="Add sub-topic"
                        onClick={e => { e.stopPropagation(); setAddingSubFor(addingSubFor === c.id ? null : c.id); setSubWhere(''); setSubWhat('') }}>
                        <i className="ti ti-plus" aria-hidden="true" />
                      </button>
                    )}
                    {catMenuItems.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button className="icon-btn" style={{ padding: '1px 5px', fontSize: 13 }}
                          onClick={e => openCtxMenu(e, { id: c.id, type: 'category' })}>
                          <i className="ti ti-dots-vertical" aria-hidden="true" />
                        </button>
                        {openMenu?.id === c.id && openMenu?.type === 'category' && (
                          <ContextMenu items={catMenuItems} onClose={() => setOpenMenu(null)}
                            style={{ right: 0, top: '100%' }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!isCollapsed && activeSubs.map(s => {
                  const sMenuItems = subMenuItems(s, c.id)
                  return (
                    <div key={s.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 8px 6px 28px', cursor: 'pointer', fontSize: 12, borderLeft: selType === 'sub' && selId === s.id ? '2px solid #378ADD' : '2px solid transparent', background: selType === 'sub' && selId === s.id ? 'var(--bg)' : s.deleted ? 'rgba(226,75,74,0.04)' : 'transparent', color: selType === 'sub' && selId === s.id ? 'var(--text)' : 'var(--text2)', opacity: s.deleted ? 0.6 : 1 }}
                      onClick={() => !s.deleted && onSelect(s.id, 'sub')}>
                      <span className={`dot ${dotCls(s.status)}`} style={{ marginTop: 4, flexShrink: 0 }} />
                      <i className="ti ti-corner-down-right" aria-hidden="true" style={{ fontSize: 11, opacity: 0.35, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: 1.4, textDecoration: s.deleted ? 'line-through' : 'none', color: s.deleted ? 'var(--text2)' : s.status === 'pass' ? '#3B6D11' : s.status === 'fail' ? '#A32D2D' : s.status === 'prog' ? '#854F0B' : 'inherit' }}>{s.title}</span>
              {(() => {
                const total = countAll(s.comments)
                const unread = countUnread(s.comments, readMap[s.id])
                return (<>
                  {total > 0 && <span style={{ fontSize: 10, color: 'var(--text2)', display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
                    <i className="ti ti-message-circle" aria-hidden="true" style={{fontSize:10}} /> {total}
                  </span>}
                  {unread > 0 && <span style={{ fontSize: 10, fontWeight:600, color:'white', background:'#378ADD', borderRadius:20, padding:'1px 6px', flexShrink:0 }}>{unread}</span>}
                </>)
              })()}
                      {sMenuItems.length > 0 && (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button className="icon-btn" style={{ padding: '1px 4px', fontSize: 13 }}
                            onClick={e => { e.stopPropagation(); openCtxMenu(e, { id: s.id, type: 'sub', changeId: c.id }) }}>
                            <i className="ti ti-dots-vertical" aria-hidden="true" />
                          </button>
                          {openMenu?.id === s.id && openMenu?.type === 'sub' && (
                            <ContextMenu items={sMenuItems} onClose={() => setOpenMenu(null)}
                              style={{ right: 0, top: '100%' }} />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {!isCollapsed && addingSubFor === c.id && (
                  <div style={{ padding: '6px 10px 8px 28px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>WHERE</div>
                        <input type="text" placeholder="Skill 1..." value={subWhere} onChange={e => setSubWhere(e.target.value)} style={{ width: '100%', fontSize: 12, padding: '4px 7px' }} autoFocus />
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>WHAT</div>
                        <input type="text" placeholder="Description" value={subWhat} onChange={e => setSubWhat(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSub(c.id); if (e.key === 'Escape') setAddingSubFor(null) }}
                          style={{ width: '100%', fontSize: 12, padding: '4px 7px' }} />
                      </div>
                    </div>
                    {subWhere && subWhat && <div style={{ fontSize: 11, color: 'var(--text2)', fontStyle: 'italic' }}>{subTitle(subWhere, subWhat)}</div>}
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn" style={{ fontSize: 11 }} onClick={() => handleAddSub(c.id)}>Add</button>
                      <button className="icon-btn" onClick={() => setAddingSubFor(null)}><i className="ti ti-x" aria-hidden="true" /></button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div style={{ padding: '8px 10px', borderTop: '0.5px solid var(--border)', flexShrink: 0 }}>
          {addingChange ? (
            <div style={{ display: 'flex', gap: 5 }}>
              <input type="text" placeholder="Category title..." value={newChangeText} onChange={e => setNewChangeText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChange(); if (e.key === 'Escape') setAddingChange(false) }}
                style={{ flex: 1, fontSize: 12, padding: '5px 7px' }} autoFocus />
              <button className="btn" style={{ padding: '3px 8px' }} onClick={handleAddChange}>Add</button>
              <button className="icon-btn" onClick={() => setAddingChange(false)}><i className="ti ti-x" aria-hidden="true" /></button>
            </div>
          ) : (
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddingChange(true)}>
              <i className="ti ti-plus" aria-hidden="true" /> Add category
            </button>
          )}
        </div>

        {isAdmin && (
          <div style={{ padding: '8px 10px', borderTop: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>AI generate</div>
            <textarea value={aiNotes} onChange={e => setAiNotes(e.target.value)} placeholder="Paste patch notes..." style={{ width: '100%', height: 60, fontSize: 12, padding: '6px 8px' }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onGenerate(aiNotes)} disabled={generating}>
                <i className="ti ti-sparkles" aria-hidden="true" /> {generating ? 'Generating...' : 'Generate'}
              </button>
              <button className="btn" style={{ fontSize: 11 }} onClick={() => setAiNotes(EXAMPLE)}>eg</button>
            </div>
          </div>
        )}
      </div>

      <div onMouseDown={onMouseDown}
        style={{ width: 5, cursor: 'col-resize', background: 'transparent', borderRight: '0.5px solid var(--border)', flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.background = '#378ADD44'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />

      {deleteTarget && (
        <DeleteConfirmModal authorName={testerName} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
      )}

      {editCategoryTarget && (
        <EditCategoryModal category={editCategoryTarget} onCancel={() => setEditCategoryTarget(null)}
          onSave={(updates) => { onEditCategory(editCategoryTarget.id, updates); setEditCategoryTarget(null) }} />
      )}

      {editSubTarget && (
        <EditSubModal sub={editSubTarget.sub} onCancel={() => setEditSubTarget(null)}
          onSave={(where, what) => { onEditSub(editSubTarget.changeId, editSubTarget.sub.id, where, what); setEditSubTarget(null) }} />
      )}
    </div>
  )
}
