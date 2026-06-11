import React, { useState, useRef, useEffect } from 'react'

const STATUS_OPTIONS = [
  { val: 'none', label: 'Open' },
  { val: 'prog', label: 'In progress' },
  { val: 'pass', label: 'Passed' },
  { val: 'fail', label: 'Failed' },
]

export default function FilterDropdown({ filterStatuses, setFilterStatuses, filterVisibility, setFilterVisibility, isPrivileged }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected = filterStatuses.includes('all')

  const toggleAll = () => setFilterStatuses(['all'])

  const toggleStatus = (val) => {
    if (filterStatuses.includes('all')) {
      // deselect all, select only this one
      setFilterStatuses([val])
    } else if (filterStatuses.includes(val)) {
      const next = filterStatuses.filter(v => v !== val)
      setFilterStatuses(next.length ? next : ['all'])
    } else {
      const next = [...filterStatuses, val]
      setFilterStatuses(next.length === STATUS_OPTIONS.length ? ['all'] : next)
    }
  }

  const activeCount = filterStatuses.includes('all') ? 0 : filterStatuses.length
  const visCount = filterVisibility === 'deleted' ? 1 : 0
  const totalActive = activeCount + visCount

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn" onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
        <i className="ti ti-filter" aria-hidden="true" style={{ fontSize: 13 }} />
        Filter
        {totalActive > 0 && (
          <span style={{ background: '#378ADD', color: 'white', fontSize: 10, borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>
            {totalActive}
          </span>
        )}
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} aria-hidden="true" style={{ fontSize: 11 }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 250, background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '10px 0', minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

          {/* Status group */}
          <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Status
          </div>

          {/* All option — parent checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#378ADD' }} />
            <span style={{ fontWeight: 500 }}>All</span>
          </label>

          {/* Child checkboxes — indented */}
          {STATUS_OPTIONS.map(opt => (
            <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 26px', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <input type="checkbox"
                checked={allSelected || filterStatuses.includes(opt.val)}
                onChange={() => toggleStatus(opt.val)}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#378ADD' }} />
              {opt.label}
            </label>
          ))}

          {/* Visibility group — privileged only */}
          {isPrivileged && (
            <>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '8px 0' }} />
              <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                Visibility
                <span style={{ fontSize: 9, background: '#FAEEDA', color: '#633806', borderRadius: 20, padding: '1px 5px' }}>privileged</span>
              </div>
              {['active', 'deleted'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input type="radio" name="visibility" checked={filterVisibility === v} onChange={() => setFilterVisibility(v)}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#378ADD' }} />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
