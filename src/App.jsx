import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import { EYE, SPAWN } from './layout.js'
import { onIdentity, presence } from './mvw.js'
import { setMuted } from './audio.js'
import { startSong } from './song.js'
import OwnerPanel from './OwnerPanel.jsx'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => {
    setLocked(v)
    if (v) setFree(false) // the mouse is locked now; Esc brings back the menu as a pause screen
  }, [])
  // Every arrival, portal or not, starts on the menu: one clear click to walk in and lock the mouse.
  const [free, setFree] = useState(false)
  const freeRef = useRef(free)
  freeRef.current = free
  const onWhere = useCallback((w) => {
    setWhere(w)
    presence(w)
  }, [])
  const [me, setMe] = useState(null) // who's visiting, from the Metaverse Browser
  useEffect(() => onIdentity(setMe), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const nearOwner = where.includes('owner')
  const [talking, setTalking] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('freelook', free)
  }, [free])
  // talking counts as playing so releasing the mouse for Monir's panel doesn't flash the start screen
  const playing = locked || touchOn || free || talking
  useEffect(() => {
    if (!free || talking) return
    if (isTouch) {
      setTouch(true) // phones: the joystick needs no click, so just turn it on
      setFree(false)
      return
    }
    const click = (e) => !e.target.closest('button, a, .guide') && lockRef.current?.()
    addEventListener('mousedown', click)
    return () => removeEventListener('mousedown', click)
  }, [free, talking]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!nearOwner) setDismissed(false)
  }, [nearOwner])
  useEffect(() => {
    if (nearOwner && (locked || touchOn || free) && !dismissed) {
      setFree(false)
      setTalking(true)
      document.exitPointerLock?.()
    } else if (!nearOwner) setTalking(false)
  }, [nearOwner, locked, touchOn, free, dismissed])
  const endTalk = useCallback(() => {
    setDismissed(true)
    setTalking(false)
    if (touchOn) return
    setFree(true)
    lockRef.current?.()
  }, [touchOn])
  useEffect(() => {
    if (!talking || touchOn) return
    const clickOut = (e) => {
      if (e.button !== 0 || e.target.closest('.guide, button, a')) return
      endTalk()
    }
    addEventListener('mousedown', clickOut)
    return () => removeEventListener('mousedown', clickOut)
  }, [talking, touchOn, endTalk])
  // music starts the first time you walk in (browsers need a click first); N or the button mutes it
  const [musicOn, setMusicOn] = useState(true)
  useEffect(() => {
    if (playing) startSong()
  }, [playing])
  useEffect(() => setMuted(!musicOn), [musicOn])
  useEffect(() => {
    const n = (e) => e.code === 'KeyN' && setMusicOn((v) => !v)
    window.addEventListener('keydown', n)
    return () => window.removeEventListener('keydown', n)
  }, [])
  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  return (
    <>
      <Canvas camera={{ fov: 72, near: 0.05, far: 200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
        <World />
        <Player lockRef={lockRef} freeRef={freeRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      {talking && <OwnerPanel visitor={me?.name} onClose={endTalk} />}
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="musictoggle" onClick={() => setMusicOn((v) => !v)}>
        {musicOn ? '♪ music on' : '♪ music off'}
      </button>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && !talking && <div className="crosshair" />}
      {free && !talking && <div className="hint">Move the mouse to look · click to lock it · WASD to walk</div>}
      {touchOn && !talking && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {!playing && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Cambridge, MA · closed, rebuilt here{me?.name ? ` · visiting as ${me.name}` : ''}</div>
            <h1>Darul Kebab</h1>
            <p className="sub">Walk in off Mass Ave: white tablecloths under red ones, the buffet of chafing dishes along the back wall, and Monir, the owner, waiting with a plate of biryani.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>WASD</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> hurry</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>N</b> music</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
