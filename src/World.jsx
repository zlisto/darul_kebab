import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { H, ROOM, DOOR, DOORS, PORTAL, KITCHEN, TABLES, TABLE, CHAIRS, HIGHCHAIR, PLANTS, BUFFET, DISHES } from './layout.js'
import * as T from './textures.js'
import Owner from './Owner.jsx'
import Portal from './Portal.jsx'

const { xMin, xMax, zMin, zMax } = ROOM
const W = xMax - xMin
const D = zMax - zMin
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24)
const CONE = new THREE.ConeGeometry(1, 1, 7)
const SPH = new THREE.SphereGeometry(1, 20, 14)
const DOME = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2)
const RING = new THREE.TorusGeometry(1, 0.08, 6, 28)

// ---------- helpers
function Instanced({ items, material, geometry }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    items.forEach((it, i) => {
      p.set(...it.p)
      e.set(0, it.r || 0, 0)
      q.setFromEuler(e)
      s.set(...(it.s || [1, 1, 1]))
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

// a point in an object's own frame (x right, z back) turned by r and moved to (ox, oz)
const at = (ox, oz, r, [x, y, z]) => [ox + x * Math.cos(r) + z * Math.sin(r), y, oz - x * Math.sin(r) + z * Math.cos(r)]

const Box = ({ p, s, r = [0, 0, 0], material }) => <mesh geometry={BOX} material={material} position={p} scale={s} rotation={r} />

// wall frames: each wall's decor is laid out in its own frame (x along the wall, +z into the room)
const NORTH = { position: [0, 0, zMin + 0.01], rotation: [0, 0, 0] }
const SOUTH = { position: [0, 0, zMax - 0.01], rotation: [0, Math.PI, 0] }
const EASTW = { position: [xMax - 0.01, 0, 0], rotation: [0, -Math.PI / 2, 0] } // wall x = world z
const WESTW = { position: [xMin, 0, 0], rotation: [0, -Math.PI / 2, 0] } // wall x = world z, +z = outside

function useMaterials() {
  return useMemo(() => {
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o })
    return {
      floor: std({ map: T.tileTex(), roughness: 0.55 }),
      wall: std({ map: T.wallTex(), roughness: 0.95 }),
      ceiling: std({ map: T.ceilingTex(), roughness: 1 }),
      trim: std({ color: '#c41e24', roughness: 0.6 }),
      wood: std({ map: T.woodTex(), roughness: 0.55 }),
      darkwood: std({ color: '#3a160f', roughness: 0.6 }),
      cloth: std({ color: '#f7f5f0', roughness: 0.95 }),
      runner: std({ color: '#c8173a', roughness: 0.9 }),
      plate: std({ color: '#fbfbf8', roughness: 0.3 }),
      glass: std({ color: '#d8f0f0', roughness: 0.05, transparent: true, opacity: 0.35 }),
      teal: std({ color: '#86cdb9', roughness: 0.9 }),
      chrome: std({ color: '#e6e6e6', metalness: 1, roughness: 0.18 }),
      black: std({ color: '#151515', roughness: 0.5 }),
      skirt: std({ color: '#d3b479', metalness: 0.15, roughness: 0.45 }),
      window: std({ color: '#cfe6f5', roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
      frame: std({ color: '#2b2b2b', roughness: 0.5 }),
      redframe: std({ color: '#c41e24', roughness: 0.5 }),
      lamp: new THREE.MeshBasicMaterial({ color: '#fff4d6' }),
      lampRing: std({ color: '#d9d9d4', roughness: 0.4 }),
      pot: std({ color: '#7a4a2a' }),
      leaf: std({ color: '#3f7d3a' }),
      honey: std({ color: '#c98b4a', roughness: 0.45 }),
      varnish: std({ color: '#8f3d14', roughness: 0.35 }),
      skinface: std({ color: '#efe3c8', roughness: 0.7 }),
      sidewalk: std({ color: '#a9a49c' }),
      street: std({ color: '#3d3d40' }),
      brick: std({ map: T.brickTex() }),
      car: std({ color: '#6e1522', metalness: 0.4, roughness: 0.35 }),
      lightwood: std({ color: '#d9b27c', roughness: 0.6 }),
    }
  }, [])
}

// ---------- light + sky
function Atmosphere() {
  const { gl, scene } = useThree()
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.5
    scene.background = new THREE.Color('#bcd6ee')
    return () => {
      env.dispose()
      pm.dispose()
    }
  }, [gl, scene])
  return (
    <>
      <hemisphereLight args={['#fff6e0', '#8a5a3a', 0.9]} />
      <ambientLight intensity={0.25} />
      {/* afternoon sun through the Mass Ave windows */}
      <directionalLight position={[-16, 7, 3]} intensity={0.8} color="#fff6e8" />
      <pointLight position={[-2, H - 0.3, 0]} intensity={5} distance={9} color="#ffe6bb" />
      <pointLight position={[3, H - 0.3, 0]} intensity={5} distance={9} color="#ffe6bb" />
      <pointLight position={[5.8, H - 0.3, -2]} intensity={3} distance={6} color="#ffe6bb" />
      <pointLight position={[5.8, H - 0.3, 3]} intensity={3} distance={6} color="#ffe6bb" />
    </>
  )
}

// ---------- floor, drop ceiling, plain walls, red trim
function Shell({ M }) {
  const lamps = useMemo(() => {
    const out = []
    for (let x = xMin + 1.5; x < xMax; x += 2.4) for (let z = zMin + 1.5; z < zMax; z += 2.4) out.push({ p: [x, H - 0.005, z] })
    return out
  }, [])
  const [lampGeo, rimGeo] = useMemo(() => {
    const a = new THREE.CircleGeometry(0.1, 20)
    a.rotateX(Math.PI / 2)
    const b = new THREE.RingGeometry(0.1, 0.14, 24)
    b.rotateX(Math.PI / 2)
    return [a, b]
  }, [])
  const rims = useMemo(() => lamps.map((l) => ({ p: [l.p[0], H - 0.004, l.p[2]] })), [lamps])
  const trimY = H - 0.12
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={M.floor}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={M.ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <Instanced items={lamps} material={M.lamp} geometry={lampGeo} />
      <Instanced items={rims} material={M.lampRing} geometry={rimGeo} />
      <mesh position={[0, H / 2, zMin]} material={M.wall}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[0, H / 2, zMax]} rotation={[0, Math.PI, 0]} material={M.wall}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[xMax, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.wall}>
        <planeGeometry args={[D, H]} />
      </mesh>
      {/* red trim band just under the ceiling, on every wall */}
      <Box p={[0, trimY, zMin + 0.03]} s={[W, 0.12, 0.06]} material={M.trim} />
      <Box p={[0, trimY, zMax - 0.03]} s={[W, 0.12, 0.06]} material={M.trim} />
      <Box p={[xMax - 0.03, trimY, 0]} s={[0.06, 0.12, D]} material={M.trim} />
      <Box p={[xMin + 0.03, trimY, 0]} s={[0.06, 0.12, D]} material={M.trim} />
      {/* baseboards */}
      <Box p={[0, 0.06, zMin + 0.01]} s={[W, 0.12, 0.02]} material={M.darkwood} />
      <Box p={[0, 0.06, zMax - 0.01]} s={[W, 0.12, 0.02]} material={M.darkwood} />
      {/* a ceiling security dome and corner speakers */}
      <mesh geometry={DOME} material={M.black} position={[4.5, H, -5.4]} rotation={[Math.PI, 0, 0]} scale={[0.08, 0.07, 0.08]} />
      <Box p={[xMax - 0.15, H - 0.38, zMin + 0.15]} s={[0.2, 0.3, 0.18]} material={M.black} />
      <Box p={[xMin + 0.15, H - 0.38, zMin + 0.15]} s={[0.2, 0.3, 0.18]} material={M.black} />
    </>
  )
}

// ---------- the west wall on Mass Ave: windows, glass door, lettering, and the street outside
function Storefront({ M }) {
  const t = 0.2
  const fz = t / 2 // wall center, outside is +z in this frame
  const win0 = 0.8
  const win1 = 2.45
  const door1 = 2.25
  const pier = 0.3
  const dl = DOOR.z - DOOR.w / 2
  const dr = DOOR.z + DOOR.w / 2
  const half = D / 2
  const solid = [
    { p: [-half + 0.2, H / 2, fz], s: [0.4, H, t] },
    { p: [half - 0.2, H / 2, fz], s: [0.4, H, t] },
    { p: [dl - pier / 2, H / 2, fz], s: [pier, H, t] },
    { p: [dr + pier / 2, H / 2, fz], s: [pier, H, t] },
    { p: [0, (win1 + H) / 2, fz], s: [D, H - win1, t] },
    { p: [DOOR.z, (door1 + win1) / 2, fz], s: [DOOR.w, win1 - door1, t] },
  ]
  const sills = [[-half + 0.4, dl - pier], [dr + pier, half - 0.4]]
  return (
    <group {...WESTW}>
      {solid.map((b, i) => (
        <Box key={i} {...b} material={M.wall} />
      ))}
      {sills.map(([a, b], i) => (
        <group key={i}>
          <Box p={[(a + b) / 2, win0 / 2, fz]} s={[b - a, win0, t]} material={M.wood} />
          <Box p={[(a + b) / 2, win0 + 0.02, -0.08]} s={[b - a, 0.04, 0.26]} material={M.darkwood} />
          <mesh position={[(a + b) / 2, (win0 + win1) / 2, fz]} material={M.window}>
            <planeGeometry args={[b - a, win1 - win0]} />
          </mesh>
          {[a, (a + b) / 2, b].map((x, j) => (
            <Box key={j} p={[x, (win0 + win1) / 2, fz]} s={[0.06, win1 - win0, 0.08]} material={M.frame} />
          ))}
          <Box p={[(a + b) / 2, win1, fz]} s={[b - a, 0.06, 0.08]} material={M.frame} />
        </group>
      ))}
      {/* name on the south window, mirrored from inside */}
      <mesh position={[(sills[1][0] + sills[1][1]) / 2, 1.95, 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial map={T.windowSignTex()} transparent toneMapped={false} />
      </mesh>
      {/* glass front door */}
      <mesh position={[DOOR.z, door1 / 2, fz]} material={M.window}>
        <planeGeometry args={[DOOR.w, door1]} />
      </mesh>
      <Box p={[DOOR.z, door1, fz]} s={[DOOR.w, 0.07, 0.1]} material={M.frame} />
      <Box p={[dl + 0.03, door1 / 2, fz]} s={[0.07, door1, 0.1]} material={M.frame} />
      <Box p={[dr - 0.03, door1 / 2, fz]} s={[0.07, door1, 0.1]} material={M.frame} />
      <Box p={[DOOR.z, 0.05, fz]} s={[DOOR.w, 0.1, 0.1]} material={M.frame} />
      <Box p={[DOOR.z - 0.4, 1.05, -0.05]} s={[0.03, 0.5, 0.03]} material={M.chrome} />

      {/* Mass Ave: sidewalk, the avenue, the far sidewalk and storefronts */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 4]} material={M.sidewalk}>
        <planeGeometry args={[90, 8]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 14]} material={M.street}>
        <planeGeometry args={[90, 12]} />
      </mesh>
      {[-2, 2].map((x) =>
        Array.from({ length: 12 }, (_, i) => (
          <Box key={`${x}${i}`} p={[-30 + i * 5.5, -0.03, 14 + x * 0.05]} s={[2.4, 0.01, 0.12]} material={M.skirt} />
        )),
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 23]} material={M.sidewalk}>
        <planeGeometry args={[90, 6]} />
      </mesh>
      <mesh position={[0, 6, 26]} rotation={[0, Math.PI, 0]} material={M.brick}>
        <planeGeometry args={[70, 12]} />
      </mesh>
      <group position={[-3.5, 0, 9.2]}>
        <Box p={[0, 0.6, 0]} s={[4.4, 0.7, 1.8]} material={M.car} />
        <Box p={[-0.2, 1.2, 0]} s={[2.4, 0.6, 1.6]} material={M.car} />
        <Box p={[-0.2, 1.2, 0]} s={[2.2, 0.45, 1.62]} material={M.window} />
        {[-1.4, 1.4].map((x) =>
          [-0.85, 0.85].map((z) => <mesh key={`${x}${z}`} geometry={CYL} material={M.black} position={[x, 0.33, z]} rotation={[Math.PI / 2, 0, 0]} scale={[0.33, 0.24, 0.33]} />),
        )}
      </group>
      {[-11, 5, 16].map((x) => (
        <group key={x} position={[x, 0, 7.4]}>
          <mesh geometry={CYL} material={M.darkwood} position={[0, 1.6, 0]} scale={[0.14, 3.2, 0.14]} />
          <mesh geometry={SPH} material={M.leaf} position={[0, 4, 0]} scale={[1.8, 1.6, 1.8]} />
        </group>
      ))}
    </group>
  )
}

// ---------- tables: white cloth with a red cloth across it, teal napkins in the glasses
function Tables({ M }) {
  const s = TABLE.half * 2
  const items = useMemo(() => {
    const top = TABLE.top
    const cloth = TABLES.map((t) => ({ p: [t.x, 0.6, t.z], s: [s, 0.32, s] }))
    const runner = TABLES.flatMap((t) => [
      { p: [t.x, top + 0.003, t.z], s: [s + 0.03, 0.006, 0.62] },
      { p: [t.x - s / 2 - 0.012, top - 0.1, t.z], s: [0.006, 0.2, 0.62] },
      { p: [t.x + s / 2 + 0.012, top - 0.1, t.z], s: [0.006, 0.2, 0.62] },
    ])
    const post = TABLES.map((t) => ({ p: [t.x, 0.22, t.z], s: [0.05, 0.44, 0.05] }))
    const foot = TABLES.map((t) => ({ p: [t.x, 0.015, t.z], s: [0.3, 0.03, 0.3] }))
    const plates = []
    const glasses = []
    const stems = []
    const naps = []
    const forks = []
    TABLES.forEach((t) =>
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ux, uz]) => {
        const r = Math.atan2(ux, uz)
        plates.push({ p: [t.x + ux * 0.36, top + 0.01, t.z + uz * 0.36], s: [0.11, 0.012, 0.11] })
        forks.push({ p: at(t.x + ux * 0.36, t.z + uz * 0.36, r, [-0.16, top + 0.01, 0]), r, s: [0.02, 0.006, 0.18] })
        // glass with a folded napkin, to the diner's right
        const [gx, , gz] = at(t.x + ux * 0.28, t.z + uz * 0.28, r, [0.2, 0, 0])
        glasses.push({ p: [gx, top + 0.15, gz], s: [0.04, 0.1, 0.04] })
        stems.push({ p: [gx, top + 0.05, gz], s: [0.008, 0.1, 0.008] })
        naps.push({ p: [gx, top + 0.24, gz], r, s: [0.075, 0.18, 0.04] })
      }),
    )
    const shakers = TABLES.flatMap((t) => [-1, 1].map((sx) => ({ p: [t.x + sx * 0.04, top + 0.045, t.z], s: [0.02, 0.08, 0.02] })))
    const caps = shakers.map((c) => ({ p: [c.p[0], top + 0.095, c.p[2]], s: [0.021, 0.02, 0.021] }))
    return { cloth, runner, post, foot, plates, glasses, stems, naps, forks, shakers, caps }
  }, [s])
  return (
    <>
      <Instanced items={items.cloth} material={M.cloth} geometry={BOX} />
      <Instanced items={items.runner} material={M.runner} geometry={BOX} />
      <Instanced items={items.post} material={M.darkwood} geometry={CYL} />
      <Instanced items={items.foot} material={M.darkwood} geometry={CYL} />
      <Instanced items={items.plates} material={M.plate} geometry={CYL} />
      <Instanced items={items.forks} material={M.chrome} geometry={BOX} />
      <Instanced items={items.glasses} material={M.glass} geometry={CYL} />
      <Instanced items={items.stems} material={M.glass} geometry={CYL} />
      <Instanced items={items.naps} material={M.teal} geometry={CONE} />
      <Instanced items={items.shakers} material={M.glass} geometry={CYL} />
      <Instanced items={items.caps} material={M.chrome} geometry={CYL} />
    </>
  )
}

// ---------- dark cherry chairs with vertical slats
function Chairs({ M }) {
  const parts = useMemo(() => {
    const out = []
    for (const c of CHAIRS) {
      const put = (local, s) => out.push({ p: at(c.x, c.z, c.r, local), r: c.r, s })
      put([0, 0.46, 0], [0.44, 0.05, 0.44]) // seat
      for (const sx of [-1, 1]) {
        put([sx * 0.19, 0.23, -0.19], [0.04, 0.46, 0.04]) // front legs
        put([sx * 0.19, 0.5, 0.2], [0.045, 1.0, 0.045]) // back legs run up into the back
      }
      put([0, 0.96, 0.2], [0.43, 0.08, 0.035]) // top rail
      put([0, 0.55, 0.2], [0.4, 0.04, 0.03]) // lower rail
      for (const sx of [-0.12, -0.04, 0.04, 0.12]) put([sx, 0.75, 0.2], [0.04, 0.38, 0.02]) // slats
      put([0, 0.15, 0], [0.4, 0.03, 0.03]) // stretcher
    }
    return out
  }, [])
  return <Instanced items={parts} material={M.wood} geometry={BOX} />
}

// ---------- the buffet along the east wall: gold-skirted counter, round chafing dishes, labels
function Buffet({ M }) {
  const { x0, x1, z0, z1, top } = BUFFET
  const cx = (x0 + x1) / 2
  const labels = useMemo(() => DISHES.map((d) => new THREE.MeshBasicMaterial({ map: T.labelTex(d.name), toneMapped: false })), [])
  const parts = useMemo(() => {
    const pans = DISHES.map((d) => ({ p: [d.x, top + 0.14, d.z], s: [0.3, 0.1, 0.3] }))
    const rims = DISHES.map((d) => ({ p: [d.x, top + 0.19, d.z], s: [0.31, 0.012, 0.31] }))
    const legs = DISHES.flatMap((d) =>
      [0, 1, 2, 3].map((k) => {
        const a = (k * Math.PI) / 2 + Math.PI / 4
        return { p: [d.x + Math.cos(a) * 0.29, top + 0.06, d.z + Math.sin(a) * 0.29], s: [0.012, 0.12, 0.012] }
      }),
    )
    const burners = DISHES.map((d) => ({ p: [d.x, top + 0.04, d.z], s: [0.05, 0.07, 0.05] }))
    const knobs = DISHES.map((d) => ({ p: [d.x + 0.05, top + 0.45, d.z], s: [0.025, 0.025, 0.025] }))
    return { pans, rims, legs, burners, knobs }
  }, [top])
  return (
    <>
      <Box p={[cx, top / 2, (z0 + z1) / 2]} s={[x1 - x0, top, z1 - z0]} material={M.skirt} />
      <Box p={[cx, top - 0.01, (z0 + z1) / 2]} s={[x1 - x0 + 0.04, 0.03, z1 - z0 + 0.04]} material={M.darkwood} />
      <Instanced items={parts.pans} material={M.chrome} geometry={CYL} />
      <Instanced items={parts.rims} material={M.chrome} geometry={CYL} />
      <Instanced items={parts.legs} material={M.chrome} geometry={CYL} />
      <Instanced items={parts.burners} material={M.black} geometry={CYL} />
      <Instanced items={parts.knobs} material={M.black} geometry={SPH} />
      {DISHES.map((d, i) => (
        <group key={d.name}>
          {/* roll-top lid, tipped back toward the wall a little */}
          <mesh geometry={DOME} material={M.chrome} position={[d.x + 0.03, top + 0.19, d.z]} rotation={[0, 0, -0.22]} scale={[0.3, 0.25, 0.3]} />
          <mesh geometry={RING} material={M.chrome} position={[d.x + 0.07, top + 0.44, d.z]} rotation={[0, Math.PI / 2, -0.22]} scale={[0.05, 0.035, 0.05]} />
          {/* name card standing in front */}
          <mesh position={[x0 + 0.08, top + 0.08, d.z]} rotation={[0, -Math.PI / 2, 0]} material={labels[i]}>
            <planeGeometry args={[0.24, 0.07]} />
          </mesh>
        </group>
      ))}
      {/* stacks of plates and the black utensil tray at the south end */}
      <mesh geometry={CYL} material={M.plate} position={[6.5, top + 0.08, 4.55]} scale={[0.14, 0.16, 0.14]} />
      <mesh geometry={CYL} material={M.plate} position={[6.5, top + 0.06, 4.95]} scale={[0.14, 0.12, 0.14]} />
      <Box p={[6.5, top + 0.05, 5.25]} s={[0.36, 0.1, 0.3]} material={M.black} />
    </>
  )
}

// ---------- the light wood high chair
function HighChair({ M }) {
  const { x, z, r } = HIGHCHAIR
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box key={`${sx}${sz}`} p={[sx * 0.2, 0.42, sz * 0.2]} r={[sz * 0.08, 0, -sx * 0.08]} s={[0.04, 0.86, 0.04]} material={M.lightwood} />
        )),
      )}
      <Box p={[0, 0.78, 0]} s={[0.34, 0.04, 0.34]} material={M.lightwood} />
      <Box p={[0, 1.02, 0.16]} s={[0.34, 0.42, 0.03]} material={M.lightwood} />
      {[-1, 1].map((sx) => (
        <Box key={sx} p={[sx * 0.16, 0.92, 0]} s={[0.03, 0.2, 0.34]} material={M.lightwood} />
      ))}
      <Box p={[0, 0.25, 0]} s={[0.42, 0.03, 0.03]} material={M.lightwood} />
    </group>
  )
}

// ---------- wall decor
function Frame({ w, h, map, frame, p, mat = '#f4f1ea' }) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0.02]} s={[w + 0.1, h + 0.1, 0.04]} material={frame} />
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={mat} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[w * 0.78, h * 0.78]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
    </group>
  )
}

function Violin({ M }) {
  return (
    <group rotation={[0, 0, 0.3]}>
      <mesh geometry={SPH} material={M.varnish} position={[0, -0.12, 0.04]} scale={[0.1, 0.12, 0.035]} />
      <mesh geometry={SPH} material={M.varnish} position={[0, 0.08, 0.04]} scale={[0.082, 0.1, 0.035]} />
      <Box p={[0, 0.3, 0.05]} s={[0.03, 0.24, 0.025]} material={M.varnish} />
      <Box p={[0, 0.12, 0.078]} s={[0.035, 0.36, 0.008]} material={M.black} />
      <mesh geometry={SPH} material={M.varnish} position={[0, 0.44, 0.05]} scale={[0.025, 0.03, 0.025]} />
      <Box p={[0, -0.19, 0.078]} s={[0.05, 0.08, 0.008]} material={M.black} />
    </group>
  )
}

// a small banjo: round body with a pale skin and a short neck
function Banjo({ M }) {
  return (
    <group rotation={[0, 0, -0.45]}>
      <mesh geometry={CYL} material={M.varnish} position={[0, -0.16, 0.035]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 0.06, 0.1]} />
      <mesh geometry={CYL} material={M.skinface} position={[0, -0.16, 0.066]} rotation={[Math.PI / 2, 0, 0]} scale={[0.082, 0.005, 0.082]} />
      <Box p={[0, 0.12, 0.04]} s={[0.035, 0.42, 0.03]} material={M.honey} />
      <Box p={[0, 0.36, 0.04]} s={[0.05, 0.08, 0.035]} material={M.varnish} />
    </group>
  )
}

function TV({ p, w = 1.2, map, M }) {
  const h = w * 0.57
  return (
    <group position={p}>
      <Box p={[0, 0, 0.05]} s={[w + 0.06, h + 0.06, 0.08]} material={M.black} />
      <mesh position={[0, 0, 0.092]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Decor({ M }) {
  const dance = useMemo(() => [T.danceTex(2), T.danceTex(5)], [])
  return (
    <>
      {/* north wall: violin, the red-framed banjo history, the banjo; dark wood panel in the far corner */}
      <group {...NORTH}>
        <group position={[-4.6, 1.8, 0]}>
          <Violin M={M} />
        </group>
        <Frame w={0.62} h={0.78} map={T.certTex()} frame={M.redframe} mat="#f7f3e8" p={[-3.7, 1.75, 0]} />
        <group position={[-2.6, 1.85, 0]}>
          <Banjo M={M} />
        </group>
        <Box p={[4.8, 0.55, 0.05]} s={[2.2, 1.1, 0.1]} material={M.darkwood} />
      </group>
      {/* east wall over the buffet: one TV on, two off, and two dance photos */}
      <group {...EASTW}>
        <TV p={[-3.3, 2.35, 0]} w={1.0} map={T.tvShowTex()} M={M} />
        <TV p={[-1.95, 2.4, 0]} w={1.3} map={T.tvOffTex()} M={M} />
        <TV p={[-0.55, 2.4, 0]} w={1.3} map={T.tvOffTex()} M={M} />
        <Frame w={0.8} h={0.95} map={dance[0]} frame={M.black} p={[-1.4, 1.62, 0]} />
        <Frame w={1.3} h={0.95} map={dance[1]} frame={M.black} p={[1.0, 1.62, 0]} />
        <Frame w={0.8} h={0.95} map={T.landscapeTex()} frame={M.black} p={[3.3, 1.62, 0]} />
      </group>
      {/* south wall: kitchen door with the sign, a painting */}
      <group {...SOUTH}>
        <Box p={[-KITCHEN.x, 1.05, 0.03]} s={[KITCHEN.w, 2.1, 0.05]} material={M.wood} />
        <mesh geometry={CYL} material={M.window} position={[-KITCHEN.x, 1.5, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[0.17, 0.01, 0.17]} />
        <Box p={[-KITCHEN.x, 2.13, 0.04]} s={[KITCHEN.w + 0.12, 0.08, 0.07]} material={M.darkwood} />
        <mesh position={[-KITCHEN.x, 2.45, 0.03]}>
          <planeGeometry args={[1.5, 0.38]} />
          <meshBasicMaterial map={T.signTex()} toneMapped={false} />
        </mesh>
        <Frame w={1.3} h={1.0} map={T.paintingTex()} frame={M.black} p={[0.4, 1.7, 0]} />
        <Frame w={0.9} h={0.7} map={dance[0]} frame={M.black} p={[3.2, 1.7, 0]} />
      </group>
      {PLANTS.map(([x, z]) => (
        <group key={z} position={[x, 0, z]}>
          <mesh geometry={CYL} material={M.pot} position={[0, 0.25, 0]} scale={[0.22, 0.5, 0.22]} />
          <mesh geometry={SPH} material={M.leaf} position={[0, 0.9, 0]} scale={[0.4, 0.55, 0.4]} />
        </group>
      ))}
    </>
  )
}

export default function World() {
  const M = useMaterials()
  return (
    <>
      <Atmosphere />
      <Shell M={M} />
      <Storefront M={M} />
      <Tables M={M} />
      <Chairs M={M} />
      <Buffet M={M} />
      <HighChair M={M} />
      <Decor M={M} />
      <Owner />
      {/* walk out the front door onto Mass Ave and you're in Metaverse Square */}
      <Portal x={xMin + 0.1} z={DOOR.z} rot={Math.PI / 2} w={DOOR.w} h={2.25} label="Metaverse Square" sub="every world · portal" {...PORTAL} />
      {DOORS.map((d) => (
        <Portal key={d.id} x={d.x} z={d.z} rot={d.rot} href={d.href} spawn={d.spawn} back={d.back} label={d.label} sub={d.sub} color={d.color} w={1.4} h={2.25} />
      ))}
    </>
  )
}
