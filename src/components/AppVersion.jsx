import React from 'react'

// Bump APP_VERSION manually when new features ship
// Format: MAJOR.MINOR.FEATURE.BUILD
// BUILD auto-increments from deploy date (MMDD)
const APP_VERSION = '1.0.3'
const BUILD = new Date().toLocaleDateString('en-NZ', { month:'2-digit', day:'2-digit' }).replace('/','')
export const FULL_VERSION = `${APP_VERSION}.${BUILD}`

export default function AppVersion() {
  return (
    <div style={{
      position: 'fixed', bottom: 8, right: 12, zIndex: 50,
      fontSize: 10, color: 'var(--text3)', userSelect: 'none',
      opacity: 0.5, letterSpacing: '.03em'
    }}>
      v{FULL_VERSION}
    </div>
  )
}
