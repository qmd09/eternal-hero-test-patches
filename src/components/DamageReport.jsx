import React, { useState } from 'react'
import { uid, timeAgo, uploadToCloudinary, IMG_LIMIT } from '../utils'
import { useNavigate } from 'react-router-dom'

const MASTERIES = ['Two-handed','Dual Swords','Scythe','Sword & Shield','Glaives','Rifle','Dual Pistols','Staff','Stone Orb','Bow']

function formatDps(n) { return n ? String(n) : '—' }
function formatTime(s) {
  const n = parseInt(s)
  if (isNaN(n)) return s + 's'
  if (n >= 60) return Math.floor(n/60) + 'm' + (n%60 ? (n%60)+'s' : '')
  return n + 's'
}

// ── Record Modal ──────────────────────────────────────────────────────────────
function RecordModal({ patchVersion, testerName, record, onSave, onCancel }) {
  const editing = !!record
  const [mastery, setMastery] = useState(record?.mastery || MASTERIES[0])
  const [weapon, setWeapon] = useState(record?.weapon || '')
  const [build, setBuild] = useState(record?.build || '')
  const [notes, setNotes] = useState(record?.notes || '')
  const [instances, setInstances] = useState(
    record?.instances || [{ id: uid(), title: '', time: '60', dps: '', screenshots: [] }]
  )
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const addInstance = () => setInstances(p => [...p, { id: uid(), title: '', time: '60', dps: '', screenshots: [] }])
  const removeInstance = (id) => setInstances(p => p.filter(i => i.id !== id))
  const updateInstance = (id, field, val) => setInstances(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))

  const handleUpload = async (instId, files) => {
    setError('')
    const inst = instances.find(i => i.id === instId)
    if (!inst) return
    setUploadingIdx(instances.indexOf(inst))
    const uploaded = []
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image')) { setError('Images only'); setUploadingIdx(null); return }
      if (f.size > IMG_LIMIT) { setError(`Too large (max 5MB): ${f.name}`); setUploadingIdx(null); return }
      try {
        const r = await uploadToCloudinary(f, p => setUploadProgress(p))
        uploaded.push({ url: r.url, name: f.name })
      } catch { setError('Upload failed'); setUploadingIdx(null); return }
    }
    updateInstance(instId, 'screenshots', [...(inst.screenshots || []), ...uploaded])
    setUploadingIdx(null); setUploadProgress(0)
  }

  const handleSave = () => {
    if (!weapon.trim()) { setError('Weapon is required'); return }
    if (instances.some(i => !i.dps)) { setError('DPS required for each instance'); return }
    onSave({
      id: record?.id || uid(),
      mastery, weapon: weapon.trim(), build: build.trim(), notes: notes.trim(),
      tester: testerName, patchVersion, createdAt: record?.createdAt || Date.now(),
      instances: instances.map(i => ({ ...i, time: i.time || '60' }))
    })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:'1rem' }}>
      <div style={{ background:'var(--bg)', border:'0.5px solid var(--border2)', borderRadius:12, padding:'1.25rem', width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:15, fontWeight:500, marginBottom:14 }}>{editing ? 'Edit record' : 'Add damage record'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Mastery</label>
            <select value={mastery} onChange={e => setMastery(e.target.value)} style={{ fontSize:13, padding:'7px 9px' }}>
              {MASTERIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Weapon</label>
            <input type="text" value={weapon} onChange={e => setWeapon(e.target.value)} placeholder="e.g. Great Sword +10" />
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
          <label style={{ fontSize:12, color:'var(--text2)' }}>Build / Setup</label>
          <textarea value={build} onChange={e => setBuild(e.target.value)} placeholder="Gear, buffs, potions..." style={{ height:60, fontSize:13 }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
          <label style={{ fontSize:12, color:'var(--text2)' }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations..." style={{ height:50, fontSize:13 }} />
        </div>
        <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>DPS Instances</div>
        {instances.map((inst, idx) => (
          <div key={inst.id} style={{ border:'0.5px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom:8, background:'var(--bg2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:500 }}>Instance {idx + 1}</span>
              {instances.length > 1 && (
                <button className="icon-btn" style={{ fontSize:12, color:'#A32D2D' }} onClick={() => removeInstance(inst.id)}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:8 }}>
              <label style={{ fontSize:12, color:'var(--text2)' }}>Title</label>
              <input type="text" value={inst.title} onChange={e => updateInstance(inst.id, 'title', e.target.value)} placeholder="e.g. Full buff build, No potions..." style={{ fontSize:12 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, color:'var(--text2)' }}>Time (seconds)</label>
                <input type="number" value={inst.time} onChange={e => updateInstance(inst.id, 'time', e.target.value)} min="1" style={{ fontSize:12 }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, color:'var(--text2)' }}>Total DPS</label>
                <input type="text" value={inst.dps} onChange={e => updateInstance(inst.id, 'dps', e.target.value)} placeholder="e.g. 10m, 50q, 9s..." style={{ fontSize:12 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Screenshots</label>
              {(inst.screenshots || []).length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:6 }}>
                  {inst.screenshots.map((s, i) => (
                    <div key={i} style={{ position:'relative' }}>
                      <img src={s.url} alt={s.name} style={{ width:70, height:50, objectFit:'cover', borderRadius:6, border:'0.5px solid var(--border)' }} />
                      <button onClick={() => updateInstance(inst.id, 'screenshots', inst.screenshots.filter((_, j) => j !== i))}
                        style={{ position:'absolute', top:-4, right:-4, width:14, height:14, borderRadius:'50%', background:'#E24B4A', color:'white', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              {uploadingIdx === idx && (
                <div style={{ height:3, background:'var(--bg)', borderRadius:2, overflow:'hidden', marginBottom:5 }}>
                  <div style={{ height:'100%', background:'#378ADD', width: uploadProgress + '%', transition:'width 0.2s' }} />
                </div>
              )}
              <label className="btn" style={{ fontSize:11, cursor:'pointer', display:'inline-flex' }}>
                <i className="ti ti-camera" aria-hidden="true" /> Add screenshot
                <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => handleUpload(inst.id, e.target.files)} />
              </label>
            </div>
          </div>
        ))}
        <button className="btn" style={{ width:'100%', justifyContent:'center', marginBottom:14 }} onClick={addInstance}>
          <i className="ti ti-plus" aria-hidden="true" /> Add another instance
        </button>
        {error && <div style={{ fontSize:11, color:'#A32D2D', marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save record</button>
        </div>
      </div>
    </div>
  )
}

// ── Compare Table ─────────────────────────────────────────────────────────────
function CompareTable({ records }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [timeFilter, setTimeFilter] = useState('')

  const allTimes = [...new Set(records.flatMap(r => (r.instances || []).map(i => String(i.time || '60'))))].sort((a, b) => parseInt(a) - parseInt(b))
  const toggleRecord = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const selectedRecords = records.filter(r => selectedIds.includes(r.id))
  const compRows = selectedRecords.map(r => ({
    record: r,
    instances: timeFilter ? (r.instances || []).filter(i => String(i.time || '60') === timeFilter) : (r.instances || [])
  }))
  const allTitles = [...new Set(compRows.flatMap(row => row.instances.map(i => i.title || '(untitled)')))]

  return (
    <div style={{ padding:'1.25rem', overflowY:'auto', height:'100%' }}>
      <h2 style={{ fontSize:15, fontWeight:500, marginBottom:14 }}>Comparison Table</h2>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:12, color:'var(--text2)' }}>Filter by time</label>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ fontSize:12, padding:'5px 8px', minWidth:120 }}>
            <option value="">All times</option>
            {allTimes.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="btn" onClick={() => setSelectedIds(records.map(r => r.id))} style={{ fontSize:11 }}>Select all</button>
          <button className="btn" onClick={() => setSelectedIds([])} style={{ fontSize:11 }}>Clear</button>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
          Records to compare ({selectedIds.length} selected)
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {records.map(r => (
            <button key={r.id} onClick={() => toggleRecord(r.id)}
              style={{ fontSize:12, padding:'4px 10px', borderRadius:20, cursor:'pointer', border:`0.5px solid ${selectedIds.includes(r.id) ? '#378ADD' : 'var(--border)'}`, background: selectedIds.includes(r.id) ? '#E6F1FB' : 'var(--bg2)', color: selectedIds.includes(r.id) ? '#0C447C' : 'var(--text)' }}>
              {r.mastery} — {r.weapon}
              {r.tester && <span style={{ opacity:0.6, marginLeft:4 }}>({r.tester})</span>}
            </button>
          ))}
        </div>
      </div>
      {selectedRecords.length === 0 ? (
        <div style={{ padding:'2rem', textAlign:'center', fontSize:13, color:'var(--text2)', background:'var(--bg2)', borderRadius:8 }}>
          Select records above to compare
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:13, minWidth:'100%', border:'0.5px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                <th style={{ textAlign:'left', padding:'9px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)', minWidth:160 }}>Weapon / Mastery</th>
                <th style={{ textAlign:'left', padding:'9px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)' }}>Build</th>
                {allTitles.map(t => (
                  <th key={t} style={{ textAlign:'right', padding:'9px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)', whiteSpace:'nowrap' }}>
                    {t}
                    {timeFilter && <div style={{ fontWeight:400, opacity:0.7 }}>{formatTime(timeFilter)}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map(({ record: r, instances }, ri) => (
                <tr key={r.id} style={{ borderTop: ri > 0 ? '0.5px solid var(--border)' : 'none', background: ri % 2 === 0 ? 'var(--bg)' : 'var(--bg2)' }}>
                  <td style={{ padding:'10px 12px', verticalAlign:'top' }}>
                    <div style={{ fontWeight:500 }}>{r.mastery}</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>{r.weapon}</div>
                    <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{r.tester}</div>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)', maxWidth:180, verticalAlign:'top' }}>{r.build || '—'}</td>
                  {allTitles.map(title => {
                    const match = instances.find(i => (i.title || '(untitled)') === title)
                    return (
                      <td key={title} style={{ padding:'10px 12px', textAlign:'right', verticalAlign:'top' }}>
                        {match ? (
                          <div>
                            <div style={{ fontWeight:600, fontSize:15, color:'#3B6D11' }}>{formatDps(match.dps)}</div>
                            {!timeFilter && <div style={{ fontSize:11, color:'var(--text2)' }}>{formatTime(match.time)}</div>}
                            {(match.screenshots || []).length > 0 && (
                              <div style={{ display:'flex', gap:3, justifyContent:'flex-end', marginTop:4, flexWrap:'wrap' }}>
                                {match.screenshots.slice(0, 2).map((s, i) => (
                                  <img key={i} src={s.url} alt="" style={{ width:40, height:28, objectFit:'cover', borderRadius:4, border:'0.5px solid var(--border)' }} />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color:'var(--text2)', fontSize:12 }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DamageReport({ patch, patches, onSave, testerName, isAdmin }) {
  const nav = useNavigate()
  const [tab, setTab] = useState('records')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [sortBy, setSortBy] = useState('mastery')
  const [filterMastery, setFilterMastery] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const records = patch?.damageRecords || []

  const saveRecords = async (updated) => {
    await onSave(patches.map(p => p.id === patch.id ? { ...p, damageRecords: updated } : p))
  }

  const handleSave = async (record) => {
    const existing = records.find(r => r.id === record.id)
    await saveRecords(existing ? records.map(r => r.id === record.id ? record : r) : [...records, record])
    setShowModal(false); setEditRecord(null); setSelectedId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    await saveRecords(records.filter(r => r.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  let filtered = filterMastery === 'all' ? records : records.filter(r => r.mastery === filterMastery)
  if (sortBy === 'mastery') filtered = [...filtered].sort((a, b) => a.mastery.localeCompare(b.mastery))
  else if (sortBy === 'date') filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt)

  const selected = records.find(r => r.id === selectedId)

  const masteryGroups = MASTERIES.map(m => {
    const recs = records.filter(r => r.mastery === m)
    if (!recs.length) return null
    const bestDps = recs.flatMap(r => (r.instances || []).map(i => i.dps)).filter(Boolean)[0] || '—'
    return { mastery: m, count: recs.length, bestDps }
  }).filter(Boolean)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* topbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderBottom:'0.5px solid var(--border)', background:'var(--bg)', flexShrink:0 }}>
        <i className="ti ti-sword" aria-hidden="true" style={{ fontSize:17 }} />
        <span style={{ fontSize:14, fontWeight:500, flex:1 }}>
          <span style={{ color:'var(--text2)', cursor:'pointer' }} onClick={() => nav(isAdmin ? `/admin/patch/${patch.id}` : `/patch/${patch.id}`)}>
            {patch.title}
          </span>
          <span style={{ opacity:0.35, margin:'0 5px' }}>/</span>
          <span>Damage Report</span>
        </span>
        <span style={{ fontSize:11, color:'var(--text2)', padding:'2px 8px', border:'0.5px solid var(--border)', borderRadius:20 }}>
          {patch.version || patch.title}
        </span>
        <button className="btn" onClick={() => { setEditRecord(null); setShowModal(true) }}>
          <i className="ti ti-plus" aria-hidden="true" /> Add record
        </button>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', borderBottom:'0.5px solid var(--border)', background:'var(--bg)', flexShrink:0 }}>
        {[['records','Records'], ['compare','Compare']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            style={{ padding:'9px 18px', fontSize:13, cursor:'pointer', background:'none', border:'none', borderBottom: tab === val ? '2px solid #378ADD' : '2px solid transparent', color: tab === val ? 'var(--text)' : 'var(--text2)', fontWeight: tab === val ? 500 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* compare tab */}
      {tab === 'compare' && (
        <div style={{ flex:1, overflow:'hidden', minHeight:0 }}>
          <CompareTable records={records} />
        </div>
      )}

      {/* records tab */}
      {tab === 'records' && (
        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', flex:1, overflow:'hidden', minHeight:0 }}>

          {/* left */}
          <div style={{ borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'0.5px solid var(--border)', display:'flex', gap:6, flexShrink:0 }}>
              <select value={filterMastery} onChange={e => setFilterMastery(e.target.value)} style={{ flex:1, fontSize:11, padding:'3px 5px' }}>
                <option value="all">All masteries</option>
                {MASTERIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex:1, fontSize:11, padding:'3px 5px' }}>
                <option value="mastery">By mastery</option>
                <option value="date">By date</option>
              </select>
            </div>

            {masteryGroups.length > 0 && (
              <div style={{ padding:'8px 10px', borderBottom:'0.5px solid var(--border)', flexShrink:0 }}>
                <div style={{ fontSize:10, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>Summary</div>
                <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ color:'var(--text2)' }}>
                      <th style={{ textAlign:'left', padding:'3px 4px', fontWeight:500 }}>Mastery</th>
                      <th style={{ textAlign:'right', padding:'3px 4px', fontWeight:500 }}>Records</th>
                      <th style={{ textAlign:'right', padding:'3px 4px', fontWeight:500 }}>Latest DPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masteryGroups.map(g => (
                      <tr key={g.mastery} style={{ borderTop:'0.5px solid var(--border)' }}>
                        <td style={{ padding:'4px 4px' }}>{g.mastery}</td>
                        <td style={{ padding:'4px 4px', textAlign:'right', color:'var(--text2)' }}>{g.count}</td>
                        <td style={{ padding:'4px 4px', textAlign:'right', fontWeight:500, color:'#3B6D11' }}>{g.bestDps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
              {filtered.length === 0 && (
                <div style={{ padding:'1.5rem', fontSize:13, color:'var(--text2)', textAlign:'center' }}>No records yet</div>
              )}
              {filtered.map(r => (
                <div key={r.id} onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                  style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'0.5px solid var(--border)', borderLeft: selectedId === r.id ? '2px solid #378ADD' : '2px solid transparent', background: selectedId === r.id ? 'var(--bg)' : 'transparent' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.mastery} — {r.weapon}</div>
                      <div style={{ fontSize:11, color:'var(--text2)', marginTop:2, display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span>{r.tester}</span>
                        <span>{timeAgo(r.createdAt)}</span>
                        <span>{r.instances?.length || 0} instance{r.instances?.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#3B6D11', flexShrink:0 }}>{formatDps(r.instances?.[0]?.dps)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right */}
          {!selected ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text2)', fontSize:13, flexDirection:'column', gap:8 }}>
              <i className="ti ti-chart-bar" aria-hidden="true" style={{ fontSize:32, opacity:0.2 }} />
              <span>Select a record to view details</span>
            </div>
          ) : (
            <div style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:10 }}>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:500 }}>{selected.mastery} — {selected.weapon}</h2>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:3, display:'flex', gap:10 }}>
                    <span>by {selected.tester}</span>
                    <span>{timeAgo(selected.createdAt)}</span>
                    <span>patch {selected.patchVersion}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn" onClick={() => { setEditRecord(selected); setShowModal(true) }}>
                    <i className="ti ti-pencil" aria-hidden="true" /> Edit
                  </button>
                  {(isAdmin || selected.tester === testerName) && (
                    <button className="btn" style={{ color:'#A32D2D' }} onClick={() => handleDelete(selected.id)}>
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {selected.build && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>Build / Setup</div>
                  <div style={{ fontSize:13, lineHeight:1.5, background:'var(--bg2)', padding:'8px 12px', borderRadius:8 }}>{selected.build}</div>
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>DPS Results</div>
                <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse', border:'0.5px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                  <thead style={{ background:'var(--bg2)' }}>
                    <tr>
                      <th style={{ textAlign:'left', padding:'8px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)' }}>Title</th>
                      <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)' }}>Time</th>
                      <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)' }}>Total DPS</th>
                      <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:500, fontSize:12, color:'var(--text2)', borderBottom:'0.5px solid var(--border)' }}>Screenshots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.instances || []).map((inst, i) => (
                      <tr key={inst.id} style={{ borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                        <td style={{ padding:'10px 12px' }}>{inst.title || <span style={{ color:'var(--text2)' }}>—</span>}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'var(--text2)' }}>{formatTime(inst.time)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:500, color:'#3B6D11', fontSize:14 }}>{formatDps(inst.dps)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right' }}>
                          {(inst.screenshots || []).length > 0 ? (
                            <div style={{ display:'flex', gap:4, justifyContent:'flex-end', flexWrap:'wrap' }}>
                              {inst.screenshots.map((s, j) => (
                                <img key={j} src={s.url} alt={s.name}
                                  onClick={() => setLightbox({ images: inst.screenshots, index: j })}
                                  style={{ width:50, height:36, objectFit:'cover', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--border)' }} />
                              ))}
                            </div>
                          ) : (
                            <span style={{ color:'var(--text2)', fontSize:12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected.notes && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>Notes</div>
                  <div style={{ fontSize:13, lineHeight:1.5, background:'var(--bg2)', padding:'8px 12px', borderRadius:8 }}>{selected.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <RecordModal
          patchVersion={patch.version || patch.title}
          testerName={testerName}
          record={editRecord}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditRecord(null) }} />
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, cursor:'pointer' }}>
          <div onClick={e => e.stopPropagation()} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, maxWidth:'92vw' }}>
            <img src={lightbox.images[lightbox.index].url} alt="" style={{ maxWidth:'90vw', maxHeight:'82vh', borderRadius:8, objectFit:'contain' }} />
            {lightbox.images.length > 1 && (
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={() => setLightbox(l => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }))}
                  style={{ fontSize:20, background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:8, padding:'4px 12px', cursor:'pointer' }}>‹</button>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{lightbox.index + 1} / {lightbox.images.length}</span>
                <button onClick={() => setLightbox(l => ({ ...l, index: (l.index + 1) % l.images.length }))}
                  style={{ fontSize:20, background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:8, padding:'4px 12px', cursor:'pointer' }}>›</button>
              </div>
            )}
          </div>
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
      )}
    </div>
  )
}
