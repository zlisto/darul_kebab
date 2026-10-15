import { pickSpawn } from './mvw.js'

// Darul Kebab, Cambridge MA: one dining room. Units are meters.
// World axes: +x = east, -z = north. The restaurant sits on the east side of Mass Ave, so the
// front door and windows are on the west wall (-x) and the buffet runs along the east wall (+x).
// You walk in from Mass Ave facing east, toward the tables and the buffet.

export const H = 3.0 // drop ceiling height
export const EYE = 1.65
export const R_PLAYER = 0.35
export const ROOM = { xMin: -7, xMax: 7, zMin: -6, zMax: 6 }
// arrival points (mvw/0.1): ?spawn=<id> picks one, see ../PROTOCOL.md
export const SPAWNS = {
  front_door: { x: -6.1, z: 0, yaw: -Math.PI / 2 }, // just inside the front door, facing east
}
SPAWNS.default = SPAWNS.front_door
export const SPAWN = pickSpawn(SPAWNS)
export const DOOR = { z: 0, w: 1.2 } // glass door in the middle of the west wall
export const KITCHEN = { x: 4.4, w: 1.1 } // swinging door in the south wall, behind the buffet

// the front door is also a portal out to Metaverse Square, the hub with a portal to every world
export const PORTAL = {
  href: import.meta.env.DEV ? 'http://localhost:5178/' : 'https://zlisto.github.io/hub_world/',
  spawn: 'by_darul_kebab', // the square's spawn in front of its portal back here
  back: 'front_door',
}

// the owner waits by the door with the biryani
export const OWNER = { x: -4.3, z: 1.4, r: 0.4 }

// the buffet: a skirted counter along the east wall with a row of round chafing dishes
export const BUFFET = { x0: 6.1, x1: ROOM.xMax, z0: -5.3, z1: 5.5, top: 0.86 }
export const DISHES = [
  'Chicken Curry', 'Chicken Tikka Masala', 'Goat Curry', 'Saag Paneer', 'Chana Masala',
  'Aloo Gobi', 'Daal', 'Vegetable Pakora', 'Biryani', 'Basmati Rice',
].map((name, i) => ({ name, x: 6.55, z: -4.5 + i * 0.92 }))

// twelve 4-tops in three columns; the west column leaves room by the door for the owner
export const TABLE = { half: 0.58, top: 0.76, chairOff: 0.78 }
export const TABLES = [-2.4, 0.6, 3.6]
  .flatMap((x) => [-4.4, -1.5, 1.4, 4.3].map((z) => [x, z]))
  .map(([x, z], i) => ({ x, z, i }))

// chairs on all four sides; r turns the chair so its back is away from the table
export const CHAIRS = TABLES.flatMap((t) =>
  [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([ux, uz]) => ({
    x: t.x + ux * TABLE.chairOff,
    z: t.z + uz * TABLE.chairOff,
    r: Math.atan2(ux, uz),
  })),
)

// a wooden high chair parked by the end of the buffet, like the photo
export const HIGHCHAIR = { x: 5.55, z: -5.4, r: -0.4 }

// potted plants in the front corners by the windows
export const PLANTS = [[-6.5, -5.5], [-6.5, 5.5]]

// walls you can't walk through: segments [a, b]. The front door is a pane of glass until it becomes a portal.
const { xMin, xMax, zMin, zMax } = ROOM
const SEGS = [
  [[xMin, zMin], [xMax, zMin]],
  [[xMin, zMax], [xMax, zMax]],
  [[xMax, zMin], [xMax, zMax]],
  [[xMin, zMin], [xMin, zMax]],
]

// tables + their chairs block a square a bit bigger than the cloth
const BLOCK = TABLE.chairOff + 0.12
const sq = (x, z, h) => ({ x0: x - h, x1: x + h, z0: z - h, z1: z + h })
export const BOXES = [
  ...TABLES.map((t) => sq(t.x, t.z, BLOCK)),
  sq(HIGHCHAIR.x, HIGHCHAIR.z, 0.3),
  ...PLANTS.map(([x, z]) => sq(x, z, 0.3)),
  { x0: BUFFET.x0, x1: BUFFET.x1, z0: BUFFET.z0, z1: BUFFET.z1 },
]

export function collide(pos) {
  const r = R_PLAYER
  for (let it = 0; it < 3; it++) {
    for (const [a, b] of SEGS) {
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const l2 = dx * dx + dz * dz
      const u = Math.max(0, Math.min(1, ((pos.x - a[0]) * dx + (pos.z - a[1]) * dz) / l2))
      const ex = pos.x - (a[0] + dx * u)
      const ez = pos.z - (a[1] + dz * u)
      const d = Math.hypot(ex, ez)
      if (d < r && d > 1e-6) {
        pos.x += (ex / d) * (r - d)
        pos.z += (ez / d) * (r - d)
      }
    }
    for (const bx of BOXES) {
      // circle vs box: push out along the shortest way
      const cx = Math.max(bx.x0, Math.min(bx.x1, pos.x))
      const cz = Math.max(bx.z0, Math.min(bx.z1, pos.z))
      const ex = pos.x - cx
      const ez = pos.z - cz
      const d = Math.hypot(ex, ez)
      if (d >= r) continue
      if (d > 1e-6) {
        pos.x = cx + (ex / d) * r
        pos.z = cz + (ez / d) * r
      } else {
        const pushes = [pos.x - bx.x0, bx.x1 - pos.x, pos.z - bx.z0, bx.z1 - pos.z]
        const k = pushes.indexOf(Math.min(...pushes))
        if (k === 0) pos.x = bx.x0 - r
        else if (k === 1) pos.x = bx.x1 + r
        else if (k === 2) pos.z = bx.z0 - r
        else pos.z = bx.z1 + r
      }
    }
    const ox = pos.x - OWNER.x
    const oz = pos.z - OWNER.z
    const od = Math.hypot(ox, oz)
    const rr = r + OWNER.r
    if (od < rr && od > 1e-6) {
      pos.x = OWNER.x + (ox / od) * rr
      pos.z = OWNER.z + (oz / od) * rr
    }
  }
  return pos
}

export const TALK_DIST = 2.1

export function locate(x, z) {
  if (Math.hypot(x - OWNER.x, z - OWNER.z) < TALK_DIST) return 'Darul Kebab · talking with Monir, the owner'
  if (x > 5.0) return 'Darul Kebab · at the buffet'
  if (x < -5.4) return 'Darul Kebab · by the windows on Mass Ave'
  if (z < -5.0) return 'Darul Kebab · under the violin and banjo'
  return 'Darul Kebab · dining room'
}
