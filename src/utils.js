import { supabase } from './supabase'

export const CLOUD = 'dnhlbc7wm'
export const PRESET = 'eternal-hero-test-patch'
export const NAME_KEY = 'qa-name-v2'
export const IMG_LIMIT = 5 * 1024 * 1024
export const VID_LIMIT = 50 * 1024 * 1024

// Privileged users — can see/restore deleted, can edit/delete anything
export const PRIVILEGED = ['ImBlind', 'niloc', 'eternal']
export const isPrivileged = (name) => PRIVILEGED.includes(name)

export const uid = () => Math.random().toString(36).slice(2, 8)
export const initials = (n) => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
export const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60) return 'just now'
  if (d < 3600) return Math.floor(d / 60) + 'm ago'
  if (d < 86400) return Math.floor(d / 3600) + 'h ago'
  return Math.floor(d / 86400) + 'd ago'
}
export const catIcon = (c) => ({ mastery: 'ti-star', balance: 'ti-scale', item: 'ti-package', bugfix: 'ti-bug', other: 'ti-adjustments' }[c] || 'ti-adjustments')
export const dotCls = (s) => ({ pass: 'dp', fail: 'df', prog: 'dw', none: 'dn' }[s || 'none'] || 'dn')
export const statusBadgeCls = (s) => ({ pass: 'badge-pass', fail: 'badge-fail', prog: 'badge-prog', none: 'badge-none' }[s || 'none'] || 'badge-none')
export const statusLabel = (s) => ({ pass: 'passed', fail: 'failed', prog: 'in progress', none: 'open' }[s || 'none'] || 'open')
export const pillCls = (s) => ({ active: 'pill-active', draft: 'pill-draft', closed: 'pill-closed' }[s] || 'pill-draft')
export const subTitle = (where, what) => {
  if (where && what) return `[${where.trim()}] - ${what.trim()}`
  if (where) return `[${where.trim()}]`
  return what || ''
}

// Purge hard-deleted items older than 30 days
export const purgeOldDeleted = (patches) => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const purgeComments = (comments) => (comments || [])
    .filter(cm => !(cm.deleted && cm.deletedAt && cm.deletedAt < cutoff))
    .map(cm => ({ ...cm, replies: purgeComments(cm.replies) }))

  return patches.map(p => ({
    ...p,
    changes: (p.changes || []).map(c => ({
      ...c,
      deleted: c.deleted && c.deletedAt < cutoff ? false : c.deleted, // keep structure, just remove if expired - actually filter
      subs: (c.subs || []).filter(s => !(s.deleted && s.deletedAt && s.deletedAt < cutoff))
        .map(s => ({ ...s, comments: purgeComments(s.comments) })),
      comments: purgeComments(c.comments)
    })).filter(c => !(c.deleted && c.deletedAt && c.deletedAt < cutoff))
  }))
}

export const DEMO_PATCHES = () => {
  const now = Date.now()
  return [{
    id: 'patch-demo', title: 'Eternal Hero — Patch 3.4.0', version: '3.4.0',
    status: 'active', created: now - 86400000,
    changes: [
      {
        id: 'c1', title: 'Mastery Update', category: 'mastery',
        description: 'Two-handed, Dual Swords, Scythe, Sword & Shield, Glaives, Rifle, Dual Pistols, Staff, Stone Orb, Bow.',
        status: 'none', deleted: false,
        subs: [
          { id: 's1', title: '[Dual Swords] - Passive not triggering on every hit', where: 'Dual Swords', what: 'Passive not triggering on every hit', status: 'fail', deleted: false, comments: [{ id: 'cm1', author: 'Tony', aType: 'tester', text: 'FAIL — Dual Swords passive skips every 3rd hit.', ts: now - 900000, media: [], replies: [], deleted: false }] }
        ],
        comments: []
      },
      { id: 'c2', title: 'Bug Fixes', category: 'bugfix', description: 'Boss stun interaction fixes.', status: 'none', deleted: false, subs: [], comments: [] }
    ]
  }]
}

const ROW_ID = 'eternal-hero-test-patch'

export async function loadPatches() {
  try {
    const { data, error } = await supabase.from('patches').select('data').eq('id', ROW_ID).single()
    if (error || !data) { const demo = DEMO_PATCHES(); await savePatches(demo); return demo }
    // purge expired deleted items on load
    const purged = purgeOldDeleted(data.data)
    return purged
  } catch (e) { return DEMO_PATCHES() }
}

export async function savePatches(patches) {
  try {
    const { error } = await supabase.from('patches').upsert({ id: ROW_ID, data: patches, updated_at: new Date().toISOString() })
    if (error) console.error('savePatches error:', error)
  } catch (e) { console.error(e) }
}

export async function uploadToCloudinary(file, onProgress) {
  return new Promise((res, rej) => {
    const fd = new FormData()
    fd.append('file', file); fd.append('upload_preset', PRESET)
    const isVid = file.type.startsWith('video')
    const url = `https://api.cloudinary.com/v1_1/${CLOUD}/${isVid ? 'video' : 'image'}/upload`
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)) }
    xhr.onload = () => {
      try { const d = JSON.parse(xhr.responseText); if (d.secure_url) res({ url: d.secure_url, type: isVid ? 'video' : 'image', name: file.name }); else rej(new Error('No URL')) }
      catch (e) { rej(e) }
    }
    xhr.onerror = () => rej(new Error('Upload failed'))
    xhr.send(fd)
  })
}

export async function generateChangesFromNotes(raw) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1200,
      messages: [{ role: 'user', content: `Game QA analyst for "Eternal Hero". Return ONLY a JSON array, no markdown.\n\nPatch notes:\n${raw}\n\nFormat:\n[{"id":"c${uid()}","title":"short title","category":"mastery|balance|item|bugfix|other","description":"1-2 sentence summary","status":"none","deleted":false,"subs":[],"comments":[]}]\n\nUnique ids throughout.` }]
    })
  })
  const data = await res.json()
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}
