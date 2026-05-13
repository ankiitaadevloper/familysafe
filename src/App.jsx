import { useState, useEffect, useRef } from 'react'
import './App.css'
import { auth, db } from './firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, collection,
  onSnapshot, serverTimestamp, getDocs, query, where
} from 'firebase/firestore'

// ===== ICONS =====
const Icon = ({ name, size = 20 }) => {
  const icons = {
    shield: <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>,
    speed: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
    pin: <><path d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8z" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/><path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" fill="none"/></>,
    alert: <><path d="M12 2L1 21h22L12 2z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/><path d="M12 9v5M12 17v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    home: <path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>,
    play: <path d="M6 4l14 8-14 8V4z" fill="currentColor"/>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>,
    sos: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    settings: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></>,
    chevron: <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.8" fill="none"/><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="1.8" fill="none"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="1.8"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" fill="none"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" fill="none"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8"/></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" strokeWidth="1.8"/><line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="1.8"/></>,
    refresh: <><path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M20.5 9A9 9 0 0 0 5.6 5.6L1 10m22 4l-4.6 4.4A9 9 0 0 1 3.5 15" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
  }
  return <svg viewBox="0 0 24 24" width={size} height={size}>{icons[name]}</svg>
}

// ===== GAUGE =====
const Gauge = ({ speed, compact = false }) => {
  const dim = compact
    ? { w: 110, h: 70, cx: 55, cy: 60, r: 45, sw: 10 }
    : { w: 130, h: 90, cx: 65, cy: 70, r: 55, sw: 11 }
  const { w, h, cx, cy, r, sw } = dim
  const angle = Math.min(180, (speed / 120) * 180)
  const angleRad = (angle - 180) * (Math.PI / 180)
  const nx = cx + r * Math.cos(angleRad)
  const ny = cy + r * Math.sin(angleRad)
  const arc = (s, e, c) => {
    const sr = (s - 180) * Math.PI / 180, er = (e - 180) * Math.PI / 180
    const sx = cx + r * Math.cos(sr), sy = cy + r * Math.sin(sr)
    const ex = cx + r * Math.cos(er), ey = cy + r * Math.sin(er)
    return <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round"/>
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} stroke="rgba(255,255,255,0.06)" strokeWidth={sw} fill="none" strokeLinecap="round"/>
      {arc(0,60,'#5eddb4')}{arc(60,120,'#ffb347')}{arc(120,180,'#ff5e6c')}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="4" fill="white"/>
    </svg>
  )
}

// ===== HELPERS =====
const HOME = { lat: 18.5204, lng: 73.8567 }

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'FAM-'
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

const getAvatar = (index) => {
  const avatars = ['avatar-mom', 'avatar-dad', 'avatar-sis', 'avatar-bro', 'avatar-me']
  return avatars[index % avatars.length]
}

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?'

// ===== ARROW MARKER HTML =====
const arrowMarker = (color, opacity = '0.2') =>
  `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="${color}" opacity="${opacity}"/>
      <circle cx="18" cy="18" r="12" fill="${color}"/>
      <path d="M18 10 L24 24 L18 21 L12 24 Z" fill="white"/>
    </svg>
  </div>`

// ===== STYLES =====
const S = {
  app: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative', paddingBottom: 90 },
  glass: { background: 'rgba(31,38,64,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' },
  topBar: { padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'linear-gradient(to bottom, #0a0e1a 60%, transparent)', zIndex: 50, backdropFilter: 'blur(8px)' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, background: 'rgba(31,38,64,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px 24px', display: 'flex', justifyContent: 'space-around', zIndex: 100 },
  navBtn: (active) => ({ background: 'none', border: 'none', color: active ? '#f5f5f0' : '#6b7088', padding: '8px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }),
  avatarBg: (avatar) => avatar === 'avatar-mom' ? 'linear-gradient(135deg,#f9c9b6,#e89570)' : avatar === 'avatar-dad' ? 'linear-gradient(135deg,#b6dcf9,#70a8e8)' : avatar === 'avatar-sis' ? 'linear-gradient(135deg,#d9b6f9,#a570e8)' : avatar === 'avatar-bro' ? 'linear-gradient(135deg,#f9eab6,#e8c870)' : 'linear-gradient(135deg,#b6f9d9,#70e8a5)',
}

// ===== JOIN FAMILY SCREEN =====
const JoinFamily = ({ currentUser, onJoined, onSkip }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const joinFamily = async () => {
    if (!code.trim()) { setError('Please enter an invite code'); return }
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'families'), where('inviteCode', '==', code.trim().toUpperCase()))
      const snapshot = await getDocs(q)
      if (snapshot.empty) { setError('Invalid invite code. Please check and try again.'); setLoading(false); return }
      const familyDoc = snapshot.docs[0]
      const familyId = familyDoc.id
      const familyData = familyDoc.data()
      const currentMembers = familyData.members || []
      if (currentMembers.includes(auth.currentUser.uid)) { setError('You are already in this family!'); setLoading(false); return }
      await setDoc(doc(db, 'families', familyId), { ...familyData, members: [...currentMembers, auth.currentUser.uid] })
      await setDoc(doc(db, 'users', auth.currentUser.uid), { ...currentUser, familyId })
      onJoined(code)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 24px', background: '#0a0e1a' }}>
      <div style={{ marginTop: 60, marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>👨‍👩‍👧‍👦</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 12 }}>Join your family</h1>
        <p style={{ color: '#a4a8b8', fontSize: 15, lineHeight: 1.5, textAlign: 'center' }}>Enter the invite code shared by your family member to connect and track each other safely.</p>
      </div>
      <div style={{ background: 'rgba(31,38,64,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7088', marginBottom: 8 }}>Invite Code</div>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. FAM-X7K2"
          style={{ width: '100%', padding: '16px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f5f5f0', fontFamily: 'Geist Mono, monospace', fontSize: 20, letterSpacing: '0.15em', outline: 'none', textAlign: 'center' }}
        />
        {error && <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: 10, fontSize: 13, color: '#ff5e6c', textAlign: 'center' }}>{error}</div>}
      </div>
      <button onClick={joinFamily} style={{ width: '100%', padding: 18, borderRadius: 14, background: loading ? '#ccc' : '#f5f5f0', color: '#0a0e1a', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
        {loading ? '⏳ Joining...' : 'Join Family'}
      </button>
      <button onClick={onSkip} style={{ width: '100%', padding: 16, borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#a4a8b8', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
        Skip — I'll join later
      </button>
      <div style={{ marginTop: 'auto', padding: '20px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 8 }}>Your invite code to share</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 22, fontWeight: 700, color: '#d4a574', letterSpacing: '0.2em' }}>{currentUser?.inviteCode || 'Loading...'}</div>
        <div style={{ fontSize: 12, color: '#6b7088', marginTop: 6 }}>Share this with family members so they can join you</div>
      </div>
    </div>
  )
}

// ===== SPLASH / AUTH SCREEN =====
const Splash = ({ onContinue }) => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputStyle = { width: '100%', padding: '16px 18px', background: 'rgba(31,38,64,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#f5f5f0', fontFamily: 'inherit', fontSize: 15, outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 24px', background: 'radial-gradient(ellipse 600px 600px at 50% 0%, rgba(107,168,255,0.08), transparent)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 48, animation: 'fadeUp 0.6s ease-out' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #5eddb4, #6ba8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(94,221,180,0.15)' }}>
          <Icon name="shield" size={20} />
        </div>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em' }}>FamilySafe</span>
      </div>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 52, lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.04em', marginBottom: 20, animation: 'fadeUp 0.8s ease-out' }}>
        Drive safe.<br />Stay <em style={{ fontStyle: 'italic', color: '#d4a574', fontWeight: 400 }}>connected.</em>
      </h1>
      <p style={{ color: '#a4a8b8', fontSize: 15, lineHeight: 1.5, marginBottom: 28, animation: 'fadeUp 1s ease-out 0.1s both' }}>
        Real-time tracking, speed alerts, and accident detection — built for families who care.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, animation: 'fadeUp 1s ease-out 0.3s both' }}>
        {[
          { icon: 'speed', color: '#6ba8ff', bg: 'rgba(107,168,255,0.15)', title: 'Live speed monitoring', desc: 'Alert family when driving above 80 km/h' },
          { icon: 'alert', color: '#ff5e6c', bg: 'rgba(255,94,108,0.15)', title: 'Accident detection', desc: 'Unexpected stops trigger instant alerts' },
          { icon: 'pin', color: '#5eddb4', bg: 'rgba(94,221,180,0.15)', title: 'Real-time location', desc: 'See where everyone is, distance from home' },
        ].map(f => (
          <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', ...S.glass, borderRadius: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={f.icon} size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#6b7088', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 1s ease-out 0.4s both' }}>
        <div style={{ display: 'flex', background: 'rgba(31,38,64,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 4 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: 10, border: 'none', background: mode === m ? '#1a2033' : 'transparent', color: mode === m ? '#f5f5f0' : '#6b7088', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
        {mode === 'signup' && <input style={inputStyle} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />}
        <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
        {error && <div style={{ padding: '10px 14px', background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: 10, fontSize: 13, color: '#ff5e6c', textAlign: 'center' }}>{error}</div>}
        <button
          onClick={async () => {
            if (!email || !pass) { setError('Please enter email and password'); return }
            setLoading(true)
            setError('')
            try {
              if (mode === 'signup') {
                const cred = await createUserWithEmailAndPassword(auth, email, pass)
                const newCode = generateInviteCode()
                const newFamilyId = cred.user.uid
                await setDoc(doc(db, 'users', cred.user.uid), {
                  name: name || 'Family Member',
                  email,
                  uid: cred.user.uid,
                  createdAt: serverTimestamp(),
                  familyId: newFamilyId,
                  inviteCode: newCode
                })
                await setDoc(doc(db, 'families', newFamilyId), {
                  ownerId: cred.user.uid,
                  ownerName: name || 'Family Member',
                  inviteCode: newCode,
                  members: [cred.user.uid],
                  createdAt: serverTimestamp()
                })
              } else {
                await signInWithEmailAndPassword(auth, email, pass)
              }
              onContinue(mode)
            } catch (err) {
              setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim())
            }
            setLoading(false)
          }}
          style={{ width: '100%', padding: 18, borderRadius: 14, background: loading ? '#ccc' : '#f5f5f0', color: '#0a0e1a', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
        >
          {loading ? '⏳ Please wait...' : mode === 'login' ? 'Enter App' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

// ===== DASHBOARD =====
const Dashboard = ({ members, alerts, onDismissAlert, selectedId, onSelectMember, isJourneyActive, mySpeed, myTopSpeed, myLocation, onToggleJourney, onSOS, goTo, onAddMember }) => {
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef([])

  const featured = (selectedId && members.find(m => m.id === selectedId))
    || members.find(m => m.isDriving)
    || members[0]
    || { id: 'placeholder', name: 'Loading...', initial: '?', avatar: 'avatar-me', status: 'safe', speed: 0, location: HOME, distance: 0, isDriving: false, tripDistance: 0, topSpeed: 0, duration: '—', routeFrom: '', routeTo: '' }

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return
    const map = L.map(mapRef.current, { center: [HOME.lat, HOME.lng], zoom: 11, zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 19 }).addTo(map)
    leafletRef.current = map
  }, [])

  // Update map markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch (e) { } })
    markersRef.current = []

    // Always show home pin
    const homeIcon = L.divIcon({ html: '<div class="pin-home"></div>', iconSize: [18, 18], iconAnchor: [9, 9], className: '' })
    markersRef.current.push(L.marker([HOME.lat, HOME.lng], { icon: homeIcon }).addTo(map))

    // YOUR journey is active — show your real location only
    if (isJourneyActive && myLocation) {
      const icon = L.divIcon({ html: arrowMarker('#5eddb4'), iconSize: [36, 36], iconAnchor: [18, 18], className: '' })
      markersRef.current.push(L.marker([myLocation.lat, myLocation.lng], { icon }).addTo(map))
      map.setView([myLocation.lat, myLocation.lng], 14)
      return
    }

    // Show selected/featured family member location (only if they are driving)
    if (featured.isDriving && featured.location && featured.id !== 'placeholder') {
      const icon = L.divIcon({ html: arrowMarker('#d4a574'), iconSize: [36, 36], iconAnchor: [18, 18], className: '' })
      markersRef.current.push(L.marker([featured.location.lat, featured.location.lng], { icon }).addTo(map))
      map.setView([featured.location.lat, featured.location.lng], 13)
      return
    }

    // Default: show home area
    map.setView([HOME.lat, HOME.lng], 12)
  }, [isJourneyActive, myLocation?.lat, myLocation?.lng, featured.id, featured.isDriving, featured.location?.lat, featured.location?.lng])

  return (
    <div style={S.app}>
      {/* Top Bar */}
      <div style={S.topBar}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 2 }}>Family Dashboard</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Watching over {members.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.iconBtn, position: 'relative' }} onClick={() => goTo('alerts')}>
            <Icon name="bell" size={18} />
            {alerts.length > 0 && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#ff5e6c', border: '2px solid #0a0e1a' }}></div>}
          </button>
          <button onClick={onAddMember} style={{ ...S.iconBtn, background: 'linear-gradient(135deg,#d4a574,#b88a5c)', border: 'none', color: '#0a0e1a' }}>
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      {/* Family Strip */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {members.map(m => (
          <div key={m.id} onClick={() => onSelectMember(m.id === selectedId ? null : m.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, minWidth: 60 }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', position: 'relative', padding: m.id === selectedId ? 2.5 : 2, background: m.id === selectedId ? 'linear-gradient(135deg,#d4a574,#b88a5c)' : 'rgba(31,38,64,0.55)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18, color: '#0a0e1a', background: S.avatarBg(m.avatar) }}>
                {m.initial}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #0a0e1a', background: m.status === 'safe' ? '#5eddb4' : m.status === 'driving' ? '#6ba8ff' : m.status === 'warn' ? '#ffb347' : '#ff5e6c', animation: m.status === 'danger' ? 'blink 0.6s infinite' : 'none' }}></div>
            </div>
            <div style={{ fontSize: 11, color: m.id === selectedId ? '#f5f5f0' : '#a4a8b8', fontWeight: m.id === selectedId ? 600 : 500, maxWidth: 60, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
          </div>
        ))}
        <div onClick={onAddMember} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, minWidth: 60 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,38,64,0.55)', border: '1.5px dashed rgba(255,255,255,0.12)', color: '#6b7088' }}>
            <Icon name="plus" size={20} />
          </div>
          <div style={{ fontSize: 11, color: '#6b7088' }}>Add</div>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.slice(0, 1).map(a => (
        <div key={a.id} style={{ margin: '0 20px 16px', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, animation: 'slideDown 0.4s ease-out', backdropFilter: 'blur(20px)', background: a.severity === 'danger' ? 'linear-gradient(135deg,rgba(255,94,108,0.18),rgba(255,94,108,0.06))' : 'linear-gradient(135deg,rgba(255,179,71,0.15),rgba(255,179,71,0.05))', border: a.severity === 'danger' ? '1px solid rgba(255,94,108,0.4)' : '1px solid rgba(255,179,71,0.3)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: a.severity === 'danger' ? 'rgba(255,94,108,0.25)' : 'rgba(255,179,71,0.2)', color: a.severity === 'danger' ? '#ff5e6c' : '#ffb347' }}>
            <Icon name="bell" size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: '#a4a8b8' }}>{a.desc.substring(0, 60)}{a.desc.length > 60 ? '…' : ''}</div>
          </div>
          <button onClick={() => onDismissAlert(a.id)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f5f0', padding: '8px 12px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Dismiss</button>
        </div>
      ))}

      {/* Section Header */}
      <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {selectedId ? `${featured.name}'s status` : 'Active trip'}
        </div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#6b7088', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {members.filter(m => m.isDriving).length} on the road
        </div>
      </div>

      {/* Trip Card */}
      <div style={{ margin: '0 20px 16px', ...S.glass, borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)' }}></div>

        {/* Card Head */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18, color: '#0a0e1a', flexShrink: 0, background: S.avatarBg(featured.avatar) }}>
            {featured.initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>{featured.name}</div>
            <div style={{ fontSize: 12, color: '#a4a8b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="pin" size={11} />
              {isJourneyActive && myLocation
                ? `📍 ${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}`
                : featured.isDriving ? `${featured.routeFrom} → ${featured.routeTo}` : 'At home'}
            </div>
          </div>
          <div style={{ padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, background: featured.status === 'warn' ? 'rgba(255,179,71,0.15)' : featured.isDriving || isJourneyActive ? 'rgba(107,168,255,0.15)' : 'rgba(94,221,180,0.15)', color: featured.status === 'warn' ? '#ffb347' : featured.isDriving || isJourneyActive ? '#6ba8ff' : '#5eddb4', border: `1px solid ${featured.status === 'warn' ? 'rgba(255,179,71,0.3)' : featured.isDriving || isJourneyActive ? 'rgba(107,168,255,0.3)' : 'rgba(94,221,180,0.3)'}` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'blink 1.2s infinite', display: 'inline-block' }}></span>
            {isJourneyActive ? (mySpeed > 80 ? 'Overspeed' : mySpeed > 2 ? 'Moving' : 'Active') : featured.isDriving ? (featured.status === 'warn' ? 'Overspeed' : 'Moving') : 'At Home'}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'center', padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 4 }}>Live Speed</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {isJourneyActive ? mySpeed : Math.round(featured.speed)}<span style={{ fontSize: 11, color: '#a4a8b8', marginLeft: 2 }}>km/h</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 4 }}>Status</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {isJourneyActive ? (mySpeed > 2 ? '🚗 Moving' : '🏠 Stationary') : featured.isDriving ? '🚗 Moving' : '🏠 At home'}
            </div>
          </div>
          <div style={{ position: 'relative', width: 110, height: 70 }}>
            <Gauge speed={isJourneyActive ? mySpeed : featured.speed} compact />
            <div style={{ position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {isJourneyActive ? mySpeed : Math.round(featured.speed)}
              </div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#6b7088', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>km/h</div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', height: 140, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          {(isJourneyActive || featured.isDriving) && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 500, background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', padding: '5px 10px', borderRadius: 100, fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5eddb4', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5eddb4', animation: 'blink 1s infinite', display: 'inline-block' }}></span>
              Live
            </div>
          )}
        </div>

        {/* Meta Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          {[
          { label: 'Distance', value: isJourneyActive ? myDistance.toFixed(2) : (featured.isDriving ? (featured.tripDistance || 0).toFixed(1) : '0.0'), unit: 'km' },
          { label: 'Top Speed', value: isJourneyActive && myTopSpeed > 0 ? myTopSpeed : (featured.isDriving ? featured.topSpeed || 0 : 0), unit: 'km/h' },
          { label: 'Duration', value: isJourneyActive ? `${String(Math.floor(myDuration/3600)).padStart(2,'0')}:${String(Math.floor((myDuration%3600)/60)).padStart(2,'0')}:${String(myDuration%60).padStart(2,'0')}` : (featured.isDriving ? featured.duration || '—' : '—'), unit: '' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{s.value}<span style={{ fontSize: 10, color: '#a4a8b8', marginLeft: 2 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        {/* Open in Google Maps */}
        <button onClick={() => {
          const lat = isJourneyActive && myLocation ? myLocation.lat : featured.location.lat
          const lng = isJourneyActive && myLocation ? myLocation.lng : featured.location.lng
          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
        }} style={{ width: '100%', padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f5f0', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <Icon name="external" size={16} />
          Open {featured.name}'s location in Google Maps
        </button>
      </div>

      {/* Journey Button */}
      <div style={{ margin: '0 20px 20px' }}>
        <button onClick={onToggleJourney} style={{ width: '100%', padding: 18, borderRadius: 16, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: isJourneyActive ? '#ff5e6c' : 'linear-gradient(135deg,#5eddb4,#4ac99a)', color: isJourneyActive ? 'white' : '#0a0e1a', boxShadow: isJourneyActive ? '0 8px 28px rgba(255,94,108,0.2)' : '0 8px 28px rgba(94,221,180,0.15)', transition: 'all 0.2s' }}>
          <Icon name={isJourneyActive ? 'stop' : 'play'} size={18} />
          {isJourneyActive ? `End Journey ${mySpeed > 0 ? `• ${mySpeed} km/h` : ''}` : 'Start My Journey'}
        </button>
      </div>

      {/* SOS Button */}
      {isJourneyActive && (
        <button onClick={onSOS} style={{ position: 'fixed', bottom: 110, right: 'calc(50% - 220px + 20px)', width: 64, height: 64, borderRadius: '50%', background: '#ff5e6c', border: 'none', color: 'white', fontWeight: 700, fontSize: 12, fontFamily: 'Geist Mono, monospace', letterSpacing: '0.05em', cursor: 'pointer', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, animation: 'sosPulse 2s infinite' }}>
          <Icon name="sos" size={22} />
          <span style={{ fontSize: 9 }}>SOS</span>
        </button>
      )}
    </div>
  )
}

// ===== ALERTS SCREEN =====
const AlertsScreen = ({ alerts, members, onDismissAlert }) => (
  <div style={{ ...S.app, paddingBottom: 90 }}>
    <div style={S.topBar}>
      <div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 2 }}>Safety Alerts</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{alerts.length} notifications</div>
      </div>
      <button style={S.iconBtn} onClick={() => alerts.forEach(a => onDismissAlert(a.id))}>
        <Icon name="refresh" size={18} />
      </button>
    </div>
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7088' }}>
          <Icon name="bell" size={40} />
          <div style={{ marginTop: 16, fontSize: 14 }}>All clear. Everyone is safe.</div>
        </div>
      )}
      {alerts.map(a => {
        const member = members.find(m => m.id === a.memberId) || {}
        const color = a.severity === 'danger' ? '#ff5e6c' : a.severity === 'warn' ? '#ffb347' : '#5eddb4'
        return (
          <div key={a.id} style={{ ...S.glass, borderRadius: 18, padding: 16, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}20`, color }}>
                <Icon name={a.severity === 'danger' ? 'alert' : a.severity === 'warn' ? 'bell' : 'shield'} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#6b7088' }}>{a.type} · {a.time}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#a4a8b8', lineHeight: 1.5, marginBottom: 10 }}>{a.desc}</div>
            <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[{ label: 'Speed', value: a.speed }, { label: 'Location', value: a.location }, { label: 'Member', value: member.name || 'Family' }].map(s => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7088', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// ===== SETTINGS SCREEN =====
const SettingsScreen = ({ members, inviteCode, currentUser, onRemoveMember, onJoinFamily, onLogout }) => {
  const [notifSpeed, setNotifSpeed] = useState(true)
  const [notifAccident, setNotifAccident] = useState(true)
  const [notifTrips, setNotifTrips] = useState(false)

  const Toggle = ({ on, toggle }) => (
    <div onClick={toggle} style={{ width: 44, height: 26, borderRadius: 100, background: on ? '#5eddb4' : '#1a2033', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'transform 0.2s', transform: on ? 'translateX(18px)' : 'translateX(0)' }}></div>
    </div>
  )

  return (
    <div style={{ ...S.app, paddingBottom: 90 }}>
      <div style={S.topBar}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 2 }}>Settings</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Your account</div>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{ margin: '0 20px 24px', ...S.glass, borderRadius: 22, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#b6f9d9,#70e8a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 26, color: '#0a0e1a', flexShrink: 0 }}>
          {getInitial(currentUser?.name || 'Y')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, marginBottom: 2 }}>{currentUser?.name || 'You'}</div>
          <div style={{ fontSize: 13, color: '#a4a8b8' }}>{currentUser?.email || ''}</div>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7088', marginBottom: 10, padding: '0 4px' }}>Notifications</div>
        <div style={{ ...S.glass, borderRadius: 16, overflow: 'hidden' }}>
          {[
            { icon: 'speed', label: 'Overspeed alerts', desc: 'Alert when speed exceeds 80 km/h', on: notifSpeed, toggle: () => setNotifSpeed(!notifSpeed) },
            { icon: 'alert', label: 'Accident detection', desc: 'Sudden stop notifications', on: notifAccident, toggle: () => setNotifAccident(!notifAccident) },
            { icon: 'map', label: 'Trip updates', desc: 'Notify on trip start/end', on: notifTrips, toggle: () => setNotifTrips(!notifTrips) },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1a2033', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#d4a574' }}>
                <Icon name={row.icon} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12, color: '#6b7088' }}>{row.desc}</div>
              </div>
              <Toggle on={row.on} toggle={row.toggle} />
            </div>
          ))}
        </div>
      </div>

      {/* Family Members */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7088', marginBottom: 10, padding: '0 4px' }}>Family Members</div>
        <div style={{ ...S.glass, borderRadius: 16, overflow: 'hidden' }}>
          {members.map((m, i, arr) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: '#0a0e1a', flexShrink: 0, background: S.avatarBg(m.avatar) }}>
                {m.initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{m.name} <span style={{ color: '#6b7088', fontWeight: 400, fontSize: 11 }}>· {m.role}</span></div>
                <div style={{ fontSize: 11, color: '#6b7088' }}>{m.email}</div>
              </div>
              <button onClick={() => onRemoveMember(m.id)} style={{ background: 'transparent', border: '1px solid rgba(255,94,108,0.3)', color: '#ff5e6c', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
            </div>
          ))}

          {/* Invite Code Box */}
          <div style={{ margin: '0 16px 14px', marginTop: members.length > 0 ? 14 : 0, background: 'rgba(212,165,116,0.08)', border: '1px dashed rgba(212,165,116,0.3)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7088', marginBottom: 4 }}>Family invite code</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 18, fontWeight: 700, color: '#d4a574', letterSpacing: '0.2em' }}>{inviteCode || 'Loading...'}</div>
            <div style={{ fontSize: 11, color: '#a4a8b8', marginTop: 6 }}>Share this code with family to add them</div>
          </div>

        </div>
      </div>

      {/* Account */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7088', marginBottom: 10, padding: '0 4px' }}>Account</div>
        <div style={{ ...S.glass, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1a2033', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#d4a574' }}>
              <Icon name="shield" size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>About FamilySafe</div>
              <div style={{ fontSize: 12, color: '#6b7088' }}>Version 1.0.0</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onLogout} style={{ margin: '0 20px', width: 'calc(100% - 40px)', padding: 16, borderRadius: 14, background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.3)', color: '#ff5e6c', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Log out
      </button>
    </div>
  )
}

// ===== SOS / ACCIDENT MODAL =====
const Modal = ({ member, isSOS, onDismiss, onConfirmOk }) => (
  <div onClick={(e) => e.target === e.currentTarget && onDismiss()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
    <div style={{ background: '#1a2033', border: '1px solid rgba(255,94,108,0.4)', borderRadius: '24px 24px 0 0', padding: 32, width: '100%', maxWidth: 480, animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, background: '#6b7088', borderRadius: 100, opacity: 0.3 }}></div>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,94,108,0.15)', border: '1px solid rgba(255,94,108,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ff5e6c', animation: 'pulseDanger 1s infinite' }}>
        <Icon name={isSOS ? 'sos' : 'alert'} size={32} />
      </div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
        {isSOS ? 'SOS Sent to Family' : `${member.name} may need help`}
      </h2>
      <p style={{ color: '#a4a8b8', textAlign: 'center', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
        {isSOS ? 'Your live location has been shared with all family members.' : 'Was driving fast, then stopped suddenly. Stationary for over 3 minutes.'}
      </p>
      <div style={{ background: '#131826', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px 16px', marginBottom: 20 }}>
        {[
          { label: isSOS ? 'Current speed' : 'Last speed', value: `${Math.round(member.speed) || 0} km/h`, color: '#ffb347' },
          { label: 'Location', value: `${member.location?.lat?.toFixed(4) || '—'}, ${member.location?.lng?.toFixed(4) || '—'}`, color: '#f5f5f0' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 12, color: '#6b7088', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onConfirmOk} style={{ flex: 1, padding: 16, borderRadius: 14, background: '#131826', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f5f0', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {isSOS ? 'Cancel SOS' : "They're OK"}
        </button>
        <button onClick={() => window.open(`https://www.google.com/maps?q=${member.location?.lat || HOME.lat},${member.location?.lng || HOME.lng}`, '_blank')} style={{ flex: 1, padding: 16, borderRadius: 14, background: '#ff5e6c', border: 'none', color: 'white', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Open in Maps
        </button>
      </div>
    </div>
  </div>
)

// ===== MAIN APP =====
export default function App() {
  const [screen, setScreen] = useState('splash')
  const [view, setView] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)
  const [members, setMembers] = useState([])
  const [alerts, setAlerts] = useState([])
  const [modal, setModal] = useState(null)
  const [isSOS, setIsSOS] = useState(false)
  const [isJourneyActive, setIsJourneyActive] = useState(false)
  const [myLocation, setMyLocation] = useState(null)
  const [mySpeed, setMySpeed] = useState(0)
  const [myTopSpeed, setMyTopSpeed] = useState(0)
  const [myDistance, setMyDistance] = useState(0)
  const [myDuration, setMyDuration] = useState(0)
  const journeyStartRef = useRef(null)
  const lastLocationRef = useRef(null)
  const durationTimerRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [familyId, setFamilyId] = useState(null)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const watchIdRef = useRef(null)
  const lastAlertedRef = useRef({})

  // Load user on auth state change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCurrentUser(userData)
          setFamilyId(userData.familyId)
          setInviteCode(userData.inviteCode || '')
          if (!userData.familyId) {
            const newFamilyId = user.uid
            const newCode = generateInviteCode()
            await setDoc(doc(db, 'families', newFamilyId), { ownerId: user.uid, ownerName: userData.name, inviteCode: newCode, members: [user.uid], createdAt: serverTimestamp() })
            await setDoc(doc(db, 'users', user.uid), { ...userData, familyId: newFamilyId, inviteCode: newCode })
            setFamilyId(newFamilyId)
            setInviteCode(newCode)
          }
          setScreen('main')
        }
        setLoading(false)
      } else {
        setScreen('splash')
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // Load family members in real-time
  useEffect(() => {
    if (!familyId || screen !== 'main') return
    const unsubscribe = onSnapshot(doc(db, 'families', familyId), async (familyDoc) => {
      if (!familyDoc.exists()) return
      const familyData = familyDoc.data()
      const memberIds = familyData.members || []
      const memberProfiles = await Promise.all(
        memberIds.map(async (uid, index) => {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (!userDoc.exists()) return null
          const userData = userDoc.data()
          return { id: uid, name: userData.name || 'Family Member', role: uid === familyData.ownerId ? 'Owner' : 'Member', avatar: getAvatar(index), initial: getInitial(userData.name), email: userData.email, status: 'safe', speed: 0, location: HOME, distance: 0, isDriving: false, battery: 100, online: true, lastUpdate: 'Just now', tripDistance: 0, topSpeed: 0, duration: '—', routeFrom: 'Home', routeTo: '' }
        })
      )
      setMembers(memberProfiles.filter(Boolean))
    })
    return () => unsubscribe()
  }, [familyId, screen])

  // Live location sync from Firestore
  useEffect(() => {
    if (screen !== 'main') return
    const unsubscribe = onSnapshot(collection(db, 'locations'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data()
        const uid = change.doc.id
        setMembers(prev => prev.map(m => {
          if (m.id !== uid) return m
          const speed = data.speed || 0
          return { ...m, location: { lat: data.lat, lng: data.lng }, speed, isDriving: data.isDriving || false, status: speed > 80 ? 'warn' : data.isDriving ? 'driving' : 'safe', lastUpdate: 'Just now', routeFrom: data.isDriving ? 'On the road' : 'Home', routeTo: '', tripDistance: data.tripDistance || 0, topSpeed: Math.max(m.topSpeed || 0, speed) }
        }))
        if (data.speed > 80 && !lastAlertedRef.current[uid]) {
          lastAlertedRef.current[uid] = Date.now()
          setAlerts(prev => [{ id: `warn-${uid}-${Date.now()}`, memberId: uid, severity: 'warn', type: 'Overspeed Alert', title: `${data.name || 'Family member'} is driving fast`, time: 'Just now', speed: `${Math.round(data.speed)} km/h`, location: 'On the road', desc: `Currently at ${Math.round(data.speed)} km/h — over the 80 km/h limit.` }, ...prev])
        }
        if (data.speed <= 80) delete lastAlertedRef.current[uid]
      })
    })
    return () => unsubscribe()
  }, [screen])

  // GPS tracking
  const startTracking = async () => {
    if (!navigator.geolocation) { alert('GPS not supported on this device'); return }
    // Reset trip stats
    setMyDistance(0)
    setMyDuration(0)
    journeyStartRef.current = Date.now()
    lastLocationRef.current = null
    // Start duration timer — updates every second
    durationTimerRef.current = setInterval(() => {
      if (journeyStartRef.current) {
        const elapsed = Math.floor((Date.now() - journeyStartRef.current) / 1000)
        setMyDuration(elapsed)
      }
    }, 1000)
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed: rawSpeed } = position.coords
        const speedKmh = rawSpeed ? Math.round(rawSpeed * 3.6) : 0
        const newLocation = { lat: latitude, lng: longitude }
        setMyLocation(newLocation)
        setMySpeed(speedKmh)
        setMyTopSpeed(prev => Math.max(prev, speedKmh))
        // Calculate distance from last GPS point
        if (lastLocationRef.current) {
          const R = 6371
          const dLat = (latitude - lastLocationRef.current.lat) * Math.PI / 180
          const dLon = (longitude - lastLocationRef.current.lng) * Math.PI / 180
          const a = Math.sin(dLat/2)**2 + Math.cos(lastLocationRef.current.lat * Math.PI/180) * Math.cos(latitude * Math.PI/180) * Math.sin(dLon/2)**2
          const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          if (d > 0.005) { // only count if moved more than 5 meters
            setMyDistance(prev => prev + d)
          }
        }
        lastLocationRef.current = newLocation
        if (auth.currentUser) {
          await setDoc(doc(db, 'locations', auth.currentUser.uid), { lat: latitude, lng: longitude, speed: speedKmh, isDriving: true, timestamp: serverTimestamp(), uid: auth.currentUser.uid, name: currentUser?.name || 'Family Member' })
        }
      },
      (error) => console.log('GPS error:', error.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }

  const stopTracking = async () => {
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
    if (auth.currentUser) {
      await setDoc(doc(db, 'locations', auth.currentUser.uid), { lat: myLocation?.lat || HOME.lat, lng: myLocation?.lng || HOME.lng, speed: 0, isDriving: false, timestamp: serverTimestamp(), uid: auth.currentUser.uid })
    }
    setMySpeed(0)
    setMyLocation(null)
    setMyTopSpeed(0)
    setMyDistance(0)
    setMyDuration(0)
    journeyStartRef.current = null
    lastLocationRef.current = null
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
  }

  const triggerSOS = () => {
    const me = members.find(m => m.id === auth.currentUser?.uid) || { name: 'You', speed: mySpeed, location: myLocation || HOME }
    setIsSOS(true)
    setModal(me)
    setAlerts(prev => [{ id: `sos-${Date.now()}`, memberId: auth.currentUser?.uid, severity: 'danger', type: 'SOS Alert', title: '🚨 SOS triggered', time: 'Just now', speed: `${mySpeed} km/h`, location: 'Your current location', desc: 'SOS signal sent to all family members with your live location.' }, ...prev])
  }

  // Loading screen
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🛡️</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>FamilySafe</div>
      <div style={{ fontSize: 13, color: '#6b7088' }}>Loading...</div>
    </div>
  )

  if (screen === 'splash') return (
    <Splash onContinue={(mode) => {
      if (mode === 'signup') {
        setTimeout(() => setScreen('join'), 1500)
      } else {
        setScreen('main')
      }
    }} />
  )

  if (screen === 'join') return (
    <JoinFamily
      currentUser={currentUser}
      onJoined={() => { setScreen('main'); setView('dashboard') }}
      onSkip={() => { setScreen('main'); setView('dashboard') }}
    />
  )

  return (
    <>
      {view === 'dashboard' && (
        <Dashboard
          members={members}
          alerts={alerts}
          onDismissAlert={id => setAlerts(p => p.filter(a => a.id !== id))}
          selectedId={selectedId}
          onSelectMember={id => setSelectedId(id)}
          isJourneyActive={isJourneyActive}
          mySpeed={mySpeed}
          myTopSpeed={myTopSpeed}
          myLocation={myLocation}
          onToggleJourney={async () => {
            if (!isJourneyActive) { setIsJourneyActive(true); await startTracking() }
            else { setIsJourneyActive(false); await stopTracking() }
          }}
          onSOS={triggerSOS}
          goTo={setView}
          onAddMember={() => setScreen('join')}
        />
      )}
      {view === 'alerts' && (
        <AlertsScreen
          alerts={alerts}
          members={members}
          onDismissAlert={id => setAlerts(p => p.filter(a => a.id !== id))}
        />
      )}
      {view === 'settings' && (
        <SettingsScreen
          members={members}
          inviteCode={inviteCode}
          currentUser={currentUser}
          onRemoveMember={id => setMembers(p => p.filter(m => m.id !== id))}
          onJoinFamily={() => setScreen('join')}
          onLogout={async () => {
            await signOut(auth)
            setCurrentUser(null)
            setFamilyId(null)
            setMembers([])
            setAlerts([])
            setScreen('splash')
            setView('dashboard')
          }}
        />
      )}

      <div style={S.bottomNav}>
        {[
          { id: 'dashboard', icon: 'home', label: 'Home' },
          { id: 'alerts', icon: 'bell', label: 'Alerts' },
          { id: 'settings', icon: 'settings', label: 'Settings' },
        ].map(n => (
          <button key={n.id} style={S.navBtn(view === n.id)} onClick={() => setView(n.id)}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </button>
        ))}
      </div>

      {modal && (
        <Modal
          member={modal}
          isSOS={isSOS}
          onDismiss={() => { setModal(null); setIsSOS(false) }}
          onConfirmOk={() => {
            setModal(null)
            setIsSOS(false)
            if (!isSOS) setMembers(prev => prev.map(m => m.id === modal.id ? { ...m, status: 'driving', speed: 45 } : m))
          }}
        />
      )}
    </>
  )
}
