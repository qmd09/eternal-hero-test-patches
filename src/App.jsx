import React, { useState, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { loadPatches, savePatches, NAME_KEY, isPrivileged } from './utils'
import NameScreen from './components/NameScreen'
import Home from './components/Home'
import AdminHome from './components/AdminHome'
import PatchView from './components/PatchView'
import AppVersion from './components/AppVersion'
import DamageReport from './components/DamageReport'

function PatchRoute({ patches, onSave, testerName, onChangeName }) {
  const { id } = useParams()
  const patch = patches.find(p => p.id === id)
  if (!patch) return <div style={{ padding:'2rem', color:'var(--text2)' }}>Patch not found.</div>
  return <PatchView patch={patch} patches={patches} onSave={onSave} testerName={testerName} onChangeName={onChangeName} isAdmin={false} />
}

function AdminPatchRoute({ patches, onSave, testerName, onChangeName }) {
  const { id } = useParams()
  const patch = patches.find(p => p.id === id)
  if (!patch) return <Navigate to="/admin" />
  return <PatchView patch={patch} patches={patches} onSave={onSave} testerName={testerName} onChangeName={onChangeName} isAdmin={true} />
}

function DamageRouteWrapper({ patches, onSave, testerName, onChangeName, isAdmin }) {
  const { id } = useParams()
  const patch = patches.find(p => p.id === id)
  if (!patch) return <div style={{ padding:'2rem', color:'var(--text2)' }}>Patch not found.</div>
  return <DamageReport patch={patch} patches={patches} onSave={onSave} testerName={testerName} isAdmin={isAdmin} />
}

export default function App() {
  const [testerName, setTesterName] = useState(localStorage.getItem(NAME_KEY) || '')
  const [patches, setPatches] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadPatches().then(p => { setPatches(p); setReady(true) })
  }, [])

  const handleSave = async (updated) => {
    setPatches(updated)
    await savePatches(updated)
  }

  const handleChangeName = () => {
    if (confirm(`Change name from "${testerName}"?`)) {
      localStorage.removeItem(NAME_KEY)
      setTesterName('')
    }
  }

  if (!ready) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)', fontSize:14 }}>Loading...</div>
  if (!testerName) return <NameScreen onSave={setTesterName} />

  return (
    <>
    <AppVersion />
    <Routes>
      <Route path="/" element={<Home patches={patches} testerName={testerName} onChangeName={handleChangeName} />} />
      <Route path="/patch/:id" element={<PatchRoute patches={patches} onSave={handleSave} testerName={testerName} onChangeName={handleChangeName} />} />
      <Route path="/patch/:id/damage" element={<DamageRouteWrapper patches={patches} onSave={handleSave} testerName={testerName} onChangeName={handleChangeName} isAdmin={false} />} />
      <Route path="/admin/patch/:id/damage" element={isPrivileged(testerName) ? <DamageRouteWrapper patches={patches} onSave={handleSave} testerName={testerName} onChangeName={handleChangeName} isAdmin={true} /> : <Navigate to="/" />} />
      {/* Admin routes require a privileged tester name. Redirects non-privileged
          users to home rather than showing a blank or broken admin view. */}
      <Route path="/admin" element={isPrivileged(testerName) ? <AdminHome patches={patches} onSave={handleSave} testerName={testerName} onChangeName={handleChangeName} /> : <Navigate to="/" />} />
      <Route path="/admin/patch/:id" element={isPrivileged(testerName) ? <AdminPatchRoute patches={patches} onSave={handleSave} testerName={testerName} onChangeName={handleChangeName} /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  )
}
