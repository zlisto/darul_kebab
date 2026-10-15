import { useEffect, useRef } from 'react'
import { BUFFET, DISHES, DOOR, KITCHEN, OWNER, ROOM, TABLE, TABLES } from './layout.js'

// Black-and-pink map in the corner, same look as the Yale world.
const PAD = 1
const S = 14 // px per meter
const X0 = ROOM.xMin - PAD
const Z0 = ROOM.zMin - PAD
const Wpx = Math.round((ROOM.xMax - ROOM.xMin + 2 * PAD) * S)
const Hpx = Math.round((ROOM.zMax - ROOM.zMin + 2 * PAD) * S)
const px = (x, z) => [(x - X0) * S, (z - Z0) * S]

function drawStatic(g) {
  g.fillStyle = '#0b0b0d'
  g.fillRect(0, 0, Wpx, Hpx)
  const [rx, rz] = px(ROOM.xMin, ROOM.zMin)
  g.fillStyle = '#1a1a1f'
  g.strokeStyle = '#ff4fa3'
  g.lineWidth = 2
  g.fillRect(rx, rz, (ROOM.xMax - ROOM.xMin) * S, (ROOM.zMax - ROOM.zMin) * S)
  g.strokeRect(rx, rz, (ROOM.xMax - ROOM.xMin) * S, (ROOM.zMax - ROOM.zMin) * S)
  // front door and kitchen door as gaps
  g.strokeStyle = '#7fd3ff'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(...px(ROOM.xMin, DOOR.z - DOOR.w / 2))
  g.lineTo(...px(ROOM.xMin, DOOR.z + DOOR.w / 2))
  g.stroke()
  g.strokeStyle = '#c9a44a'
  g.beginPath()
  g.moveTo(...px(KITCHEN.x - KITCHEN.w / 2, ROOM.zMax))
  g.lineTo(...px(KITCHEN.x + KITCHEN.w / 2, ROOM.zMax))
  g.stroke()
  // the buffet counter and its chafing dishes
  const [bx, bz] = px(BUFFET.x0, BUFFET.z0)
  g.fillStyle = '#6b5530'
  g.fillRect(bx, bz, (BUFFET.x1 - BUFFET.x0) * S, (BUFFET.z1 - BUFFET.z0) * S)
  g.fillStyle = '#d9d9d9'
  for (const d of DISHES) {
    g.beginPath()
    g.arc(...px(d.x, d.z), 3.5, 0, Math.PI * 2)
    g.fill()
  }
  // tables
  for (const t of TABLES) {
    const [x, z] = px(t.x - TABLE.half, t.z - TABLE.half)
    g.fillStyle = '#e8e4da'
    g.fillRect(x, z, TABLE.half * 2 * S, TABLE.half * 2 * S)
    g.fillStyle = '#c8102e'
    const [rx0, rz0] = px(t.x - TABLE.half, t.z - 0.31)
    g.fillRect(rx0, rz0, TABLE.half * 2 * S, 0.62 * S)
  }
  // the owner
  const [ox, oz] = px(OWNER.x, OWNER.z)
  g.fillStyle = '#ffd6ea'
  g.beginPath()
  g.arc(ox, oz, 5, 0, Math.PI * 2)
  g.fill()
}

export default function Minimap({ drawRef }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current
    const g = c.getContext('2d')
    const base = document.createElement('canvas')
    base.width = Wpx
    base.height = Hpx
    drawStatic(base.getContext('2d'))
    drawRef.current = (x, z, fx, fz) => {
      g.drawImage(base, 0, 0)
      const [cx, cz] = px(x, z)
      const a = Math.atan2(fz, fx)
      g.save()
      g.translate(cx, cz)
      g.rotate(a)
      g.fillStyle = '#ff4fa3'
      g.shadowColor = '#ff4fa3'
      g.shadowBlur = 8
      g.beginPath()
      g.moveTo(9, 0)
      g.lineTo(-6, 5.5)
      g.lineTo(-3, 0)
      g.lineTo(-6, -5.5)
      g.closePath()
      g.fill()
      g.restore()
    }
    return () => (drawRef.current = null)
  }, [drawRef])
  return <canvas ref={ref} className="minimap" width={Wpx} height={Hpx} />
}
