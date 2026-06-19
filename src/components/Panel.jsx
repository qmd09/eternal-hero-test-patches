import React, { useState, useRef, useEffect, useCallback } from 'react'
import { initials, timeAgo, statusBadgeCls, statusLabel, uploadToCloudinary, uid, IMG_LIMIT, VID_LIMIT, isPrivileged } from '../utils'
import { countAll, countUnread, markRead } from '../readState'

const COLLAPSE_LINES = 4

const TAG_COLORS = [
  { bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' }, // purple
  { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5' }, // teal
  { bg: '#FAECE7', text: '#712B13', border: '#F0997B' }, // coral
  { bg: '#FBEAF0', text: '#72243E', border: '#ED93B1' }, // pink
  { bg: '#FAEEDA', text: '#633806', border: '#EF9F27' }, // amber
  { bg: '#F1EFE8', text: '#444441', border: '#B4B2A9' }, // slate
]

function tagColor(idx) { return TAG_COLORS[idx % TAG_COLORS.length] }

function TagPicker({ tags, selectedTag, onSelect, onAddTag, onClose }) {
  const [newTag, setNewTag] = React.useState('')
  const ref = React.useRef(null)
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const handleAdd = () => {
    const t = newTag.trim()
    if (!t || tags.includes(t)) return
    onAddTag(t)
    setNewTag('')
  }

  return (
    <div ref={ref} style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 200, background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 8, minWidth: 170, marginBottom: 4, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Tag this comment</div>
      {tags.length === 0 && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>No tags yet</div>}
      {tags.map((t, i) => {
        const c = tagColor(i)
        const active = selectedTag === t
        return (
          <button key={t} onClick={() => onSelect(active ? null : t)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${active ? c.border : 'transparent'}`, background: active ? c.bg : 'transparent', color: c.text, fontSize: 12, marginBottom: 2, textAlign: 'left' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.border, flexShrink: 0 }} />
            {t}
          </button>
        )
      })}
      <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
        <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="New tag..."
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose() }}
          style={{ flex: 1, fontSize: 12, padding: '4px 7px' }} autoFocus />
        <button className="btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}

function TagPill({ tag, tags, style }) {
  if (!tag) return null
  const idx = tags.indexOf(tag)
  const c = tagColor(idx >= 0 ? idx : 0)
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, fontWeight: 500, ...style }}>
      {tag}
    </span>
  )
}



const REACTIONS = ['👍','✅','❌','🐛','🔥','😮','❓','👀','💀','🗿']

function EmojiBar({ reactions = {}, testerName, onToggle }) {
  const [showPicker, setShowPicker] = React.useState(false)
  const hasReacted = (emoji) => (reactions[emoji] || []).includes(testerName)
  const total = Object.values(reactions).reduce((a, v) => a + v.length, 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {Object.entries(reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
        <button key={emoji} onClick={() => onToggle(emoji)}
          title={users.join(', ')}
          style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, padding: '2px 7px', borderRadius: 20, cursor: 'pointer', border: `0.5px solid ${hasReacted(emoji) ? '#378ADD' : 'var(--border)'}`, background: hasReacted(emoji) ? '#E6F1FB' : 'var(--bg2)', color: hasReacted(emoji) ? '#0C447C' : 'var(--text)' }}>
          <span>{emoji}</span>
          <span style={{ fontSize: 11 }}>{users.length}</span>
        </button>
      ))}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowPicker(!showPicker)}
          style={{ fontSize: 12, padding: '2px 7px', borderRadius: 20, cursor: 'pointer', border: '0.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)' }}>
          + 😀
        </button>
        {showPicker && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100, background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, width: 180, marginBottom: 4 }}>
            {REACTIONS.map(e => (
              <button key={e} onClick={() => { onToggle(e); setShowPicker(false) }}
                style={{ fontSize: 18, padding: '3px 5px', borderRadius: 6, cursor: 'pointer', border: 'none', background: hasReacted(e) ? '#E6F1FB' : 'transparent' }}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <img src={images[idx].url} alt={images[idx].name || 'screenshot'}
          style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain', display: 'block' }} />
        {images.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={prev} style={{ fontSize: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>‹</button>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{idx + 1} / {images.length}</span>
            <button onClick={next} style={{ fontSize: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>›</button>
          </div>
        )}
        {images[idx].name && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{images[idx].name}</div>}
      </div>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  )
}

// ── CommentBubble ─────────────────────────────────────────────────────────────
function CommentBubble({ cm, testerName, isAdmin, depth = 0, onReply, onEdit, onDelete, allImages, onOpenLightbox, onToggleReaction, onSetTag, allTags, onAddTag }) {
  const [collapsed, setCollapsed] = useState(false)
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(cm.text || '')
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const textRef = useRef(null)

  const canEdit = (cm.author === testerName || isPrivileged(testerName)) && cm.aType !== 'ai' && !cm.deleted
  const canDelete = !cm.deleted && (isAdmin || cm.author === testerName || isPrivileged(testerName))

  useEffect(() => {
    if (textRef.current) {
      const lineH = parseFloat(getComputedStyle(textRef.current).lineHeight) || 20
      if (textRef.current.scrollHeight > lineH * COLLAPSE_LINES + 4) {
        setNeedsCollapse(true); setCollapsed(true)
      }
    }
  }, [cm.text])

  const images = (cm.media || []).filter(m => m.type === 'image')
  const videos = (cm.media || []).filter(m => m.type === 'video')
  const visibleImages = showAllImages ? images : images.slice(0, 3)
  const hiddenCount = images.length - 3

  const handleSaveEdit = () => { if (!editText.trim()) return; onEdit(cm.id, editText.trim()); setEditing(false) }
  const handleReply = () => { if (!replyText.trim()) return; onReply(cm.id, replyText.trim()); setReplyText(''); setReplying(false) }

  return (
    <div style={{ marginLeft: Math.min(depth, 3) * 18, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: cm.aType === 'ai' ? '#E6F1FB' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: cm.aType === 'ai' ? '#0C447C' : '#1e40af', flexShrink: 0 }}>
          {cm.aType === 'ai' ? 'AI' : initials(cm.author)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '7px 10px' }}>
            {/* meta row */}
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{cm.author}</span>
              <span>{timeAgo(cm.ts)}</span>
              {cm.edited && <span style={{ fontStyle: 'italic', opacity: 0.7 }}>edited</span>}
              {cm.tag && <TagPill tag={cm.tag} tags={allTags || []} />}
              {cm.aType === 'ai' && <span className="badge badge-ai" style={{ fontSize: 10 }}>suggested</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {depth === 0 && !editing && (
                  <div style={{ position: 'relative' }}>
                    <button className="icon-btn" style={{ fontSize: 11, padding: '1px 5px' }} onClick={() => setShowTagPicker(!showTagPicker)} title="Tag">
                      <i className="ti ti-tag" aria-hidden="true" />
                    </button>
                    {showTagPicker && (
                      <TagPicker tags={allTags || []} selectedTag={cm.tag || null}
                        onSelect={(tag) => { onSetTag(cm.id, tag); setShowTagPicker(false) }}
                        onAddTag={(tag) => onAddTag(tag)}
                        onClose={() => setShowTagPicker(false)} />
                    )}
                  </div>
                )}
                {canEdit && !editing && (
                  <button className="icon-btn" style={{ fontSize: 11, padding: '1px 5px' }} onClick={() => { setEditing(true); setEditText(cm.text || '') }} title="Edit">
                    <i className="ti ti-pencil" aria-hidden="true" />
                  </button>
                )}
                {canDelete && (
                  <button className="icon-btn" style={{ fontSize: 11, padding: '1px 5px', color: '#A32D2D' }} onClick={() => onDelete(cm.id)} title="Delete">
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <textarea value={editText} onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false) }}
                  style={{ fontSize: 13, height: 70, width: '100%' }} autoFocus />
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn" style={{ fontSize: 11 }} onClick={handleSaveEdit}>Save</button>
                  <button className="btn" style={{ fontSize: 11 }} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {cm.text && (
                  <div>
                    <div ref={textRef} style={{ fontSize: 13, lineHeight: 1.5, overflow: collapsed ? 'hidden' : 'visible', display: collapsed ? '-webkit-box' : 'block', WebkitLineClamp: collapsed ? COLLAPSE_LINES : 'unset', WebkitBoxOrient: 'vertical' }}>
                      {cm.text}
                    </div>
                    {needsCollapse && (
                      <button onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 11, color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}>
                        {collapsed ? 'show more ↓' : 'show less ↑'}
                      </button>
                    )}
                  </div>
                )}

                {/* images — gallery lightbox */}
                {images.length > 0 && (
                  <div style={{ marginTop: 7 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {visibleImages.map((m, i) => (
                        <img key={i} src={m.url} alt={m.name || 'screenshot'}
                          onClick={() => onOpenLightbox(allImages, allImages.findIndex(x => x.url === m.url))}
                          style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '0.5px solid var(--border)' }} />
                      ))}
                    </div>
                    {!showAllImages && hiddenCount > 0 && (
                      <button onClick={() => setShowAllImages(true)} style={{ fontSize: 11, color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', marginTop: 3 }}>
                        + {hiddenCount} more image{hiddenCount > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}

                {/* videos */}
                {videos.map((m, i) => (
                  <div key={i} style={{ marginTop: 8, width: '100%' }}>
                    <video src={m.url} controls playsInline
                      style={{ width: 'auto', maxWidth: '100%', maxHeight: 560, borderRadius: 8, border: '0.5px solid var(--border)', display: 'block', background: '#000' }} />
                    {m.name && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{m.name}</div>}
                  </div>
                ))}
              </>
            )}
            {!cm.deleted && (
              <EmojiBar reactions={cm.reactions || {}} testerName={testerName} onToggle={(emoji) => onToggleReaction(cm.id, emoji)} />
            )}
          </div>

          {/* reply button */}
          {!editing && depth < 3 && (
            <button onClick={() => setReplying(!replying)} style={{ fontSize: 11, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <i className="ti ti-arrow-back-up" aria-hidden="true" style={{ fontSize: 12 }} /> reply
            </button>
          )}

          {replying && (
            <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'flex-end' }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`Reply to ${cm.author}...`}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleReply(); if (e.key === 'Escape') setReplying(false) }}
                style={{ flex: 1, height: 46, fontSize: 13 }} autoFocus />
              <button className="btn" style={{ padding: '4px 9px', fontSize: 12 }} onClick={handleReply}><i className="ti ti-send" aria-hidden="true" /></button>
              <button className="icon-btn" onClick={() => setReplying(false)}><i className="ti ti-x" aria-hidden="true" /></button>
            </div>
          )}

          {/* nested replies */}
          {(cm.replies || []).length > 0 && (
            <div style={{ marginTop: 6, borderLeft: '2px solid var(--border)', paddingLeft: 8 }}>
              {cm.replies.map(r => (
                <CommentBubble key={r.id} cm={r} testerName={testerName} isAdmin={isAdmin}
                  depth={depth + 1} onReply={onReply} onEdit={onEdit} onDelete={onDelete}
                  allImages={allImages} onOpenLightbox={onOpenLightbox} onToggleReaction={onToggleReaction} onSetTag={onSetTag} allTags={allTags} onAddTag={onAddTag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function Panel({ sel, selType, parentChange, testerName, isAdmin, onStatusChange, onPostComment, onDeleteComment, onEditComment, onReplyComment, onToggleReaction, onSetTag, onAddTag, topicId, lastRead, onMarkRead }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null) // { images, index }
  const [search, setSearch] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState(null)

  // collect all images across all comments for gallery nav
  // Mark comment as read when scrolled into view
  const observerRef = React.useRef(null)
  const setupObserver = React.useCallback((node) => {
    if (!node || !testerName) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && topicId) {
          markRead(testerName, topicId).then(() => { if (onMarkRead) onMarkRead(topicId) })
          observerRef.current?.disconnect()
        }
      })
    }, { threshold: 0.5 })
    observerRef.current.observe(node)
  }, [testerName, topicId])

  const allImages = (sel?.comments || []).flatMap(cm => [
    ...(cm.media || []).filter(m => m.type === 'image'),
    ...(cm.replies || []).flatMap(r => (r.media || []).filter(m => m.type === 'image'))
  ])

  if (!sel) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, color: 'var(--text2)', gap: 8, padding: '3rem', fontSize: 13 }}>
      <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 28, opacity: 0.25 }} />
      <span>Select a change or sub-topic</span>
    </div>
  )

  const handleFileSelect = (e) => {
    setError('')
    const files = Array.from(e.target.files)
    for (const f of files) {
      if (!f.type.startsWith('image') && !f.type.startsWith('video')) { setError('Only images and videos allowed.'); return }
      if (f.type.startsWith('image') && f.size > IMG_LIMIT) { setError(`Image too large (max 5MB): ${f.name}`); return }
      if (f.type.startsWith('video') && f.size > VID_LIMIT) { setError(`Video too large (max 50MB): ${f.name}`); return }
      setPending(p => [...p, { id: uid(), file: f, localUrl: URL.createObjectURL(f), type: f.type.startsWith('image') ? 'image' : 'video' }])
    }
    e.target.value = ''
  }

  const handlePost = async () => {
    if (!text.trim() && pending.length === 0) return
    setUploading(true); setProgress(0); setError('')
    const uploaded = []
    for (const pm of pending) {
      try {
        const r = await uploadToCloudinary(pm.file, p => setProgress(p))
        uploaded.push(r)
      } catch {
        setError('Upload failed — check connection.'); setUploading(false); return
      }
    }
    onPostComment({ id: 'cm' + uid(), author: testerName, aType: 'tester', text: text.trim(), ts: Date.now(), media: uploaded, replies: [] })
    setText(''); setPending([]); setUploading(false); setProgress(0)
  }

  const comments = sel.comments || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }}>

      {/* header — fixed height */}
      <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
        {parentChange && (
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-corner-down-right" aria-hidden="true" />{parentChange.title}
          </div>
        )}
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{sel.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <span className={`badge ${statusBadgeCls(sel.status)}`}>{statusLabel(sel.status)}</span>
          {sel.deleted && <span className="badge" style={{ background: '#FCEBEB', color: '#A32D2D' }}>deleted</span>}
          {selType === 'change' && sel.category && <span className="badge badge-ai">{sel.category}</span>}
          <span style={{ fontSize: 11, color: 'var(--text2)', display:'flex', alignItems:'center', gap:5 }}>
            <i className="ti ti-message-circle" aria-hidden="true" style={{fontSize:11}} />
            {countAll(sel?.comments)} comments
            {countUnread(sel?.comments, lastRead) > 0 && (
              <span style={{ fontSize:10, fontWeight:600, color:'white', background:'#378ADD', borderRadius:20, padding:'1px 6px' }}>
                {countUnread(sel?.comments, lastRead)} new
              </span>
            )}
          </span>
          {isAdmin && (
            <button className="icon-btn" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => onDeleteComment('__item__')}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
        {sel.description && <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 }}>{sel.description}</p>}
        {(isPrivileged(testerName) || isAdmin) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Status:</span>
            {['pass', 'prog', 'fail'].map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: '0.5px solid var(--border2)', background: sel.status === s ? (s === 'pass' ? '#EAF3DE' : s === 'fail' ? '#FCEBEB' : '#FAEEDA') : 'var(--bg2)', color: sel.status === s ? (s === 'pass' ? '#3B6D11' : s === 'fail' ? '#A32D2D' : '#633806') : 'var(--text2)' }}>
                {s === 'prog' ? 'in progress' : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* thread — this is the only scrollable area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', minHeight: 0 }}>
        {/* tag filter */}
        {sel?.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Filter:</span>
            <button onClick={() => setActiveTagFilter(null)}
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: `0.5px solid ${!activeTagFilter ? 'var(--border-primary)' : 'var(--border)'}`, background: !activeTagFilter ? 'var(--bg2)' : 'transparent', color: 'var(--text2)' }}>
              All
            </button>
            {sel.tags.map((t, i) => {
              const c = tagColor(i)
              return (
                <button key={t} onClick={() => setActiveTagFilter(activeTagFilter === t ? null : t)}
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: `0.5px solid ${activeTagFilter === t ? c.border : 'var(--border)'}`, background: activeTagFilter === t ? c.bg : 'transparent', color: activeTagFilter === t ? c.text : 'var(--text2)' }}>
                  {t}
                </button>
              )
            })}
          </div>
        )}
        {/* search bar */}
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="ti ti-search" aria-hidden="true" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text2)', pointerEvents: 'none' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search comments..."
              style={{ width: '100%', paddingLeft: 26, fontSize: 12, padding: '5px 8px 5px 26px' }} />
          </div>
          {search && <button onClick={() => setSearch('')} style={{ fontSize: 11, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Discussion
          </span>
          <span style={{ fontSize: 11, color: 'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
            <span><i className="ti ti-message-circle" aria-hidden="true" style={{fontSize:11, marginRight:3}} />{countAll(sel?.comments)}</span>
            {countUnread(sel?.comments, lastRead) > 0 && (
              <span style={{ fontSize:10, fontWeight:600, color:'white', background:'#378ADD', borderRadius:20, padding:'1px 7px' }}>
                {countUnread(sel?.comments, lastRead)} unread
              </span>
            )}
          </span>
        </div>
        {(() => {
          const searchLower = search.trim().toLowerCase()
          const visible = comments
            .filter(cm => !activeTagFilter || cm.tag === activeTagFilter)
            .filter(cm => !searchLower || cm.text?.toLowerCase().includes(searchLower))
          return visible.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--text2)' }}>{comments.length === 0 ? 'No comments yet.' : searchLower ? 'No comments match your search.' : 'No comments with this tag.'}</div>
            : visible.map(cm => (
              <CommentBubble key={cm.id} cm={cm} testerName={testerName} isAdmin={isAdmin}
                depth={0}
                onReply={(parentId, replyText) => onReplyComment(parentId, replyText)}
                onEdit={(cmId, newText) => onEditComment(cmId, newText)}
                onDelete={(cmId) => onDeleteComment(cmId)}
                allImages={allImages}
                onOpenLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                onToggleReaction={(cmId, emoji) => onToggleReaction(cmId, emoji)}
                onSetTag={(cmId, tag) => onSetTag(cmId, tag)}
                onAddTag={(tag) => onAddTag(tag)}
                allTags={sel?.tags || []} />
            ))
        })()}
      </div>

      {/* scroll sentinel - when visible marks topic as read */}
      <div ref={setupObserver} style={{ height: 1 }} />

      {/* compose — only if not deleted */}
      {!sel.deleted && <div style={{ borderTop: '0.5px solid var(--border)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
        {error && <div style={{ fontSize: 11, color: '#A32D2D' }}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}
        {pending.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {pending.map((m, i) => (
              <div key={m.id} style={{ position: 'relative', width: 60, height: 45 }}>
                {m.type === 'image'
                  ? <img src={m.localUrl} alt="preview" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }} />
                  : <video src={m.localUrl} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }} />
                }
                <button onClick={() => setPending(p => p.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#E24B4A', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}
        {uploading && (
          <div>
            <div style={{ height: 3, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#378ADD', width: progress + '%', transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>Uploading... {progress}%</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#1e40af', flexShrink: 0, marginBottom: 3 }}>
            {initials(testerName)}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Add observation, confirm a bug, flag edge case... (Ctrl+Enter to send)"
            onKeyDown={e => e.ctrlKey && e.key === 'Enter' && handlePost()}
            disabled={uploading}
            style={{ flex: 1, height: 54 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="icon-btn" title="Attach image/video" style={{ cursor: 'pointer' }}>
              <i className="ti ti-paperclip" aria-hidden="true" />
              <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            </label>
            <button className="icon-btn" onClick={handlePost} disabled={uploading} title="Send">
              <i className="ti ti-send" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Images max 5MB · Videos max 50MB · Ctrl+Enter to send</div>
      </div>}

      {sel.deleted && (
        <div style={{ padding: '10px 18px', borderTop: '0.5px solid var(--border)', background: 'rgba(226,75,74,0.05)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#A32D2D' }}>⚠ This item has been deleted — viewing in read-only mode</span>
        </div>
      )}

      {/* gallery lightbox */}
      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
