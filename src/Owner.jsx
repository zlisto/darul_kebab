import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OWNER } from './layout.js'
import { TALKERS } from './talk.js'
import * as T from './textures.js'

export const OWNER_SLUG = 'monir'

// The owner, built from primitives like the Yale professors: striped pink shirt, navy tie with
// white dots, a big smile, holding a square plate of biryani out toward you.
// Figure faces +z; he turns to keep facing you when you're in the room.

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const HALF = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const TORUS = new THREE.TorusGeometry(1, 0.35, 8, 20, Math.PI * 1.4)
const HAIR = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)

const SKIN = '#8a5a3c'
const HAIRC = '#16110f'
const PANTS = '#2b2b31'

const B = ({ g = SPH, c, mat, p, s, r = [0, 0, 0] }) => <mesh geometry={g} material={mat || m(c)} position={p} scale={s} rotation={r} />

// a cylinder from a to b, for arms
function Limb({ a, b, rad, mat }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return { pos: va.add(vb).multiplyScalar(0.5), quat, len }
  }, [a, b])
  return <mesh geometry={CYL} material={mat} position={pos} quaternion={quat} scale={[rad, len, rad]} />
}

function Plate() {
  const rice = useMemo(() => new THREE.MeshStandardMaterial({ map: T.riceTex(), roughness: 0.9 }), [])
  const bits = useMemo(() => {
    const out = []
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4
      const d = 0.03 + (i % 3) * 0.025
      out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d * 0.8, meat: i % 2 === 0 })
    }
    return out
  }, [])
  return (
    <>
      <B g={BOX} c="#f7f7f3" p={[0, 0, 0]} s={[0.36, 0.014, 0.36]} />
      <B g={BOX} c="#ecece6" p={[0, 0.008, 0]} s={[0.26, 0.004, 0.26]} />
      {/* the biryani mound */}
      <mesh geometry={SPH} material={rice} position={[0, 0.012, -0.005]} scale={[0.115, 0.06, 0.1]} />
      {bits.map((b, i) =>
        b.meat ? (
          <B key={i} c="#5a2a17" p={[b.x, 0.055 - Math.hypot(b.x, b.z) * 0.35, b.z]} s={[0.018, 0.012, 0.016]} />
        ) : (
          <B key={i} g={BOX} c="#3f8f2f" p={[b.x, 0.062 - Math.hypot(b.x, b.z) * 0.3, b.z]} r={[0.3, i, 0.2]} s={[0.022, 0.004, 0.014]} />
        ),
      )}
      {/* cucumber slices, lemon wedges, tomato, carrot curl */}
      {[[-0.12, 0.11], [-0.075, 0.125]].map(([x, z], i) => (
        <group key={i} position={[x, 0.03, z]} rotation={[Math.PI / 2 - 0.4, 0, 0]}>
          <B g={CYL} c="#2f6b2a" p={[0, 0, 0]} s={[0.034, 0.012, 0.034]} />
          <B g={CYL} c="#e7f0c8" p={[0, 0.001, 0]} s={[0.03, 0.013, 0.03]} />
        </group>
      ))}
      {[[0.1, 0.1], [0.135, 0.06]].map(([x, z], i) => (
        <B key={i} g={HALF} c="#f6d23a" p={[x, 0.02, z]} r={[Math.PI / 2, 0, 0.6]} s={[0.035, 0.03, 0.035]} />
      ))}
      <B g={CYL} c="#d8302a" p={[0.11, 0.012, -0.11]} r={[0.15, 0, 0.1]} s={[0.04, 0.008, 0.04]} />
      <B g={TORUS} c="#f07a1e" p={[-0.11, 0.02, -0.1]} r={[Math.PI / 2, 0, 0]} s={[0.025, 0.025, 0.025]} />
    </>
  )
}

function Face() {
  const dark = '#1b1210'
  return (
    <>
      {/* smiling eyes: narrow and a little crinkled */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B c="#f4efe6" p={[0.04 * sx, 1.645, 0.103]} s={[0.015, 0.008, 0.008]} />
          <B c={dark} p={[0.04 * sx, 1.645, 0.109]} s={[0.008, 0.007, 0.004]} />
          <B g={BOX} c={HAIRC} p={[0.042 * sx, 1.675, 0.106]} r={[0, 0, -0.12 * sx]} s={[0.04, 0.009, 0.01]} />
        </group>
      ))}
      <B c={SKIN} p={[0, 1.612, 0.115]} s={[0.021, 0.03, 0.024]} />
      {/* big smile: lips, then teeth */}
      <B c="#5a2a22" p={[0, 1.567, 0.1]} s={[0.04, 0.016, 0.012]} />
      <B g={BOX} c="#fbf8f0" p={[0, 1.569, 0.109]} s={[0.058, 0.016, 0.006]} />
    </>
  )
}

export default function Owner({ talking = false }) {
  const root = useRef()
  const body = useRef()
  const plate = useRef()
  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ map: T.shirtTex(), roughness: 0.85 }), [])
  const sleeve = useMemo(() => {
    const t = T.shirtTex().clone()
    t.repeat.set(1, 1)
    t.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })
  }, [])
  const tie = useMemo(() => new THREE.MeshStandardMaterial({ map: T.tieTex(), roughness: 0.5 }), [])
  const skin = m(SKIN)

  useEffect(() => {
    TALKERS.set(OWNER_SLUG, root.current)
    return () => TALKERS.delete(OWNER_SLUG)
  }, [])

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    // turn to face you (faster while chatting)
    const want = Math.atan2(camera.position.x - OWNER.x, camera.position.z - OWNER.z)
    let d = want - root.current.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    root.current.rotation.y += d * Math.min(1, dt * (talking ? 5 : 3))
    // breathing, a little sway, and the plate offered forward
    body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.006
    body.current.rotation.z = Math.sin(t * 0.7) * 0.015
    plate.current.position.y = 1.12 + Math.sin(t * 1.6 + 0.6) * 0.006
  })

  // arm joints (shoulder → elbow → wrist), both sides
  const arms = [-1, 1].map((sx) => ({
    sx,
    sh: [0.21 * sx, 1.38, 0],
    el: [0.25 * sx, 1.09, 0.1],
    wr: [0.19 * sx, 1.1, 0.36],
  }))

  return (
    <group ref={root} position={[OWNER.x, 0, OWNER.z]}>
      <group ref={body}>
        {/* shoes and trousers */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={BOX} c="#121212" p={[0.1 * sx, 0.04, 0.04]} s={[0.11, 0.08, 0.27]} />
            <B g={CYL} c={PANTS} p={[0.1 * sx, 0.48, 0]} s={[0.085, 0.8, 0.09]} />
          </group>
        ))}
        <B g={CYL} c={PANTS} p={[0, 0.84, 0]} s={[0.19, 0.12, 0.125]} />
        <B g={CYL} c="#111111" p={[0, 0.9, 0]} s={[0.19, 0.05, 0.126]} />
        <B g={BOX} c="#c9c9c9" p={[0, 0.9, 0.126]} s={[0.04, 0.03, 0.01]} />

        {/* shirt: torso, a bit of tummy, shoulders */}
        <mesh geometry={CYL} material={shirt} position={[0, 1.17, 0]} scale={[0.19, 0.56, 0.12]} />
        <mesh geometry={SPH} material={shirt} position={[0, 1.04, 0.015]} scale={[0.185, 0.17, 0.135]} />
        <mesh geometry={SPH} material={shirt} position={[0, 1.41, 0]} scale={[0.225, 0.08, 0.125]} />
        {/* collar points */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} geometry={BOX} material={shirt} position={[0.032 * sx, 1.468, 0.098]} rotation={[0.3, 0, 0.7 * sx]} scale={[0.06, 0.03, 0.01]} />
        ))}
        <mesh geometry={CYL} material={shirt} position={[0, 1.475, 0]} scale={[0.065, 0.04, 0.065]} />

        {/* tie: knot, blade, pointed tip */}
        <mesh geometry={BOX} material={tie} position={[0, 1.45, 0.112]} scale={[0.04, 0.038, 0.025]} />
        <mesh geometry={BOX} material={tie} position={[0, 1.22, 0.138]} rotation={[-0.07, 0, 0]} scale={[0.068, 0.42, 0.012]} />
        <mesh geometry={BOX} material={tie} position={[0, 1.005, 0.153]} rotation={[0, 0, Math.PI / 4]} scale={[0.048, 0.048, 0.012]} />

        {/* arms bent forward to hold the plate */}
        {arms.map(({ sx, sh, el, wr }) => (
          <group key={sx}>
            <B mat={sleeve} p={sh} s={[0.06, 0.06, 0.06]} />
            <Limb a={sh} b={el} rad={0.058} mat={sleeve} />
            <B mat={sleeve} p={el} s={[0.056, 0.056, 0.056]} />
            <Limb a={el} b={wr} rad={0.05} mat={sleeve} />
            <B g={CYL} c="#f8eaf2" p={wr} r={[Math.PI / 2 - 0.1, 0, 0]} s={[0.052, 0.025, 0.052]} />
            <B mat={skin} p={[wr[0] - 0.005 * sx, wr[1] - 0.005, wr[2] + 0.05]} s={[0.04, 0.03, 0.05]} />
            {/* thumbs on top of the plate rim */}
            <B mat={skin} p={[wr[0] - 0.03 * sx, wr[1] + 0.03, wr[2] + 0.07]} s={[0.014, 0.012, 0.03]} />
          </group>
        ))}

        {/* neck and head */}
        <B g={CYL} mat={skin} p={[0, 1.5, 0]} s={[0.052, 0.09, 0.052]} />
        <B mat={skin} p={[0, 1.62, 0]} s={[0.105, 0.13, 0.115]} />
        {[-1, 1].map((sx) => (
          <B key={sx} mat={skin} p={[0.105 * sx, 1.625, -0.005]} s={[0.018, 0.032, 0.022]} />
        ))}
        <Face />
        {/* hair: black cap swept back, fuller at the back, grey at the temples */}
        <B g={HAIR} c={HAIRC} p={[0, 1.625, -0.006]} r={[-0.22, 0, 0]} s={[0.112, 0.135, 0.123]} />
        <B c={HAIRC} p={[0, 1.6, -0.045]} s={[0.1, 0.09, 0.08]} />
        {[-1, 1].map((sx) => (
          <B key={sx} c="#4a4542" p={[0.1 * sx, 1.655, 0.03]} s={[0.012, 0.025, 0.022]} />
        ))}
      </group>

      {/* the plate, tipped toward you */}
      <group ref={plate} position={[0, 1.12, 0.43]} rotation={[0.45, 0, 0]}>
        <Plate />
      </group>
    </group>
  )
}
