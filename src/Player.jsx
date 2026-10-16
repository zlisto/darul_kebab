import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { EYE, SPAWN, collide, locate } from './layout.js'

// Same controls as the Yale world (flat floor here, so no stairs or risers).
// PC: WASD move, mouse look, Shift sprint, Space jump, C crouch.
// Touch controls come in through touchRef: { active, move: [x, y], look: [dx, dy], jump }.
const CROUCH_EYE = 1.05
const JUMP_SPEED = 4.2
const GRAVITY = 12
const LOOK_SPEED = 0.005 // radians per touch pixel
const MOUSE_SPEED = 0.002 // radians per mouse pixel, the same as PointerLockControls

export default function Player({ lockRef, mapRef, touchRef, freeRef, onLock, onWhere }) {
  const { camera, gl } = useThree()
  const controls = useMemo(() => new PointerLockControls(camera, gl.domElement), [camera, gl])
  const keys = useRef({})
  const where = useRef('')
  const eye = useRef(EYE)
  const jumpY = useRef(0)
  const vy = useRef(0)
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

  useEffect(() => {
    camera.position.set(SPAWN.x, EYE, SPAWN.z)
    camera.rotation.set(0, SPAWN.yaw ?? 0, 0, 'YXZ')
    lockRef.current = () => controls.lock()
    const on = () => onLock(true)
    const off = () => {
      keys.current = {} // keys held during Esc never get a keyup
      onLock(false)
    }
    controls.addEventListener('lock', on)
    controls.addEventListener('unlock', off)
    const down = (e) => {
      keys.current[e.code] = true
      if (e.code === 'Space') e.preventDefault()
    }
    const up = (e) => (keys.current[e.code] = false)
    const blur = () => (keys.current = {})
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    // Arrived through a portal (freeRef): browsers only lock the mouse after a click, so until then
    // the view follows the mouse as it moves over the page. The first click locks it for real.
    const look = (e) => {
      if (!freeRef?.current || controls.isLocked) return
      const cap = (v) => Math.max(-60, Math.min(60, v)) // the first event after a page load can jump
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= cap(e.movementX) * MOUSE_SPEED
      euler.x = Math.max(-1.45, Math.min(1.45, euler.x - cap(e.movementY) * MOUSE_SPEED))
      camera.quaternion.setFromEuler(euler)
    }
    window.addEventListener('mousemove', look)
    return () => {
      window.removeEventListener('mousemove', look)
      controls.removeEventListener('lock', on)
      controls.removeEventListener('unlock', off)
      controls.dispose()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [camera, controls, lockRef, onLock, freeRef, euler])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    // dev only: teleport for screenshots by setting <body data-go="[x, z, yawDeg, pitch]">
    if (import.meta.env.DEV && document.body.dataset.go) {
      const [x, z, yaw, pitch = 0] = JSON.parse(document.body.dataset.go)
      delete document.body.dataset.go
      camera.position.set(x, EYE, z)
      camera.rotation.set(pitch, (yaw * Math.PI) / 180, 0, 'YXZ')
    }
    const touch = touchRef.current
    // freeRef: arrived through a portal, so the keys work before the first click locks the mouse
    const active = controls.isLocked || touch.active || freeRef?.current

    if (touch.active && (touch.look[0] || touch.look[1])) {
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= touch.look[0] * LOOK_SPEED
      euler.x = Math.max(-1.45, Math.min(1.45, euler.x - touch.look[1] * LOOK_SPEED))
      camera.quaternion.setFromEuler(euler)
    }
    touch.look[0] = 0
    touch.look[1] = 0

    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()

    const k = keys.current
    let f = 0
    let s = 0
    let sprint = false
    if (active) {
      f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
      s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
      sprint = k.ShiftLeft || k.ShiftRight
    }
    if (touch.active && (touch.move[0] || touch.move[1])) {
      f = -touch.move[1]
      s = touch.move[0]
      sprint = Math.hypot(f, s) > 0.95
    }
    let mx = fwd.x * f - fwd.z * s
    let mz = fwd.z * f + fwd.x * s
    const l = Math.hypot(mx, mz)
    if (l > 0.05) {
      if (l > 1) {
        mx /= l
        mz /= l
      }
      const crouching = active && k.KeyC
      const speed = crouching ? 1.8 : sprint ? 20 : 12 // match Metaverse Web standard pace
      const pos = collide({ x: camera.position.x + mx * speed * dt, z: camera.position.z + mz * speed * dt })
      camera.position.x = pos.x
      camera.position.z = pos.z
    }

    const wantJump = (active && k.Space) || touch.jump
    touch.jump = false
    if (active && wantJump && jumpY.current === 0) vy.current = JUMP_SPEED
    vy.current -= GRAVITY * dt
    jumpY.current = Math.max(0, jumpY.current + vy.current * dt)
    if (jumpY.current === 0) vy.current = 0
    const eyeTarget = active && k.KeyC ? CROUCH_EYE : EYE
    eye.current += (eyeTarget - eye.current) * Math.min(1, dt * 12)
    camera.position.y = eye.current + jumpY.current

    mapRef.current?.(camera.position.x, camera.position.z, fwd.x, fwd.z)
    const w = locate(camera.position.x, camera.position.z)
    if (w !== where.current) {
      where.current = w
      onWhere(w)
    }
  })
  return null
}
