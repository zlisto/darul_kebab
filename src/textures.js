import * as THREE from 'three'

// Procedural canvas textures, same approach as the Yale world: no image files.

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function tex(c, repeat) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

const once = (f) => {
  let v
  return () => (v ??= f())
}

// terracotta tiles, ~45 cm, each a slightly different brown, dark grout
export const tileTex = once(() => {
  const [c, g] = canvas(512, 512)
  const n = 4
  const s = 512 / n
  const r = rng(3)
  g.fillStyle = '#5a3020'
  g.fillRect(0, 0, 512, 512)
  const tones = ['#9a5634', '#8c4b2d', '#a35f3b', '#93512f', '#7f4428']
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.fillStyle = tones[Math.floor(r() * tones.length)]
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4)
      for (let k = 0; k < 120; k++) {
        g.fillStyle = r() < 0.5 ? 'rgba(60,25,10,0.18)' : 'rgba(200,130,90,0.14)'
        const w = 4 + r() * 18
        g.beginPath()
        g.ellipse(i * s + 4 + r() * (s - 8), j * s + 4 + r() * (s - 8), w, w * (0.4 + r() * 0.6), r() * 3, 0, Math.PI * 2)
        g.fill()
      }
      // shine from the window
      const gr = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s)
      gr.addColorStop(0, 'rgba(255,220,180,0.10)')
      gr.addColorStop(1, 'rgba(0,0,0,0.08)')
      g.fillStyle = gr
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4)
    }
  return tex(c, [14 / 1.8, 12 / 1.8])
})

// buttery yellow plaster
export const wallTex = once(() => {
  const [c, g] = canvas(256, 256)
  g.fillStyle = '#f1dc8e'
  g.fillRect(0, 0, 256, 256)
  const r = rng(11)
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,245,200,0.25)' : 'rgba(190,160,80,0.12)'
    g.fillRect(r() * 256, r() * 256, 2, 2)
  }
  return tex(c, [4, 2])
})

// dark cherry wood for the chairs and the wainscot
export const woodTex = once(() => {
  const [c, g] = canvas(256, 256)
  g.fillStyle = '#4b1d14'
  g.fillRect(0, 0, 256, 256)
  const r = rng(5)
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(25,8,4,0.35)' : 'rgba(120,50,30,0.25)'
    g.lineWidth = 1 + r() * 2
    const x = r() * 256
    g.beginPath()
    g.moveTo(x, 0)
    g.bezierCurveTo(x + 6 - r() * 12, 85, x + 6 - r() * 12, 170, x + 4 - r() * 8, 256)
    g.stroke()
  }
  return tex(c, [1, 1])
})

// the owner's shirt: white with pink and navy pinstripes
export const shirtTex = once(() => {
  const [c, g] = canvas(256, 256)
  g.fillStyle = '#f8eaf2'
  g.fillRect(0, 0, 256, 256)
  for (let x = 0; x < 256; x += 16) {
    g.fillStyle = '#e3a9c9'
    g.fillRect(x, 0, 4, 256)
    g.fillStyle = '#4a5596'
    g.fillRect(x + 7, 0, 2, 256)
    g.fillStyle = '#c793b5'
    g.fillRect(x + 11, 0, 1, 256)
  }
  return tex(c, [3, 1])
})

// navy tie with small white dots
export const tieTex = once(() => {
  const [c, g] = canvas(64, 256)
  g.fillStyle = '#151b3b'
  g.fillRect(0, 0, 64, 256)
  g.fillStyle = '#eef0f8'
  for (let y = 0; y < 256; y += 10)
    for (let x = (y / 10) % 2 ? 5 : 0; x < 64; x += 10) g.fillRect(x + 2, y + 2, 3, 3)
  return tex(c)
})

// biryani: white, saffron-yellow and orange grains
export const riceTex = once(() => {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#f1dfaa'
  g.fillRect(0, 0, 512, 512)
  const r = rng(21)
  const cols = ['#fff6dc', '#fff6dc', '#f7e3a5', '#f4b73a', '#f08a24', '#e5641d', '#fbd45a']
  for (let i = 0; i < 9000; i++) {
    g.save()
    g.translate(r() * 512, r() * 512)
    g.rotate(r() * Math.PI)
    g.fillStyle = cols[Math.floor(r() * cols.length)]
    g.beginPath()
    g.ellipse(0, 0, 6 + r() * 3, 1.6, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  return tex(c, [1, 1])
})

// a bright, busy painting like the one on the back wall
export const paintingTex = once(() => {
  const [c, g] = canvas(320, 256)
  const r = rng(31)
  g.fillStyle = '#e9c46a'
  g.fillRect(0, 0, 320, 256)
  const cols = ['#d1495b', '#edae49', '#00798c', '#30638e', '#6a994e', '#f4a261', '#8d3b72', '#f6f1e9']
  for (let i = 0; i < 26; i++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)]
    g.beginPath()
    const x = r() * 320
    const y = r() * 256
    g.ellipse(x, y, 12 + r() * 30, 20 + r() * 50, r() * 3, 0, Math.PI * 2)
    g.fill()
  }
  g.strokeStyle = 'rgba(20,20,20,0.6)'
  g.lineWidth = 3
  for (let i = 0; i < 8; i++) {
    g.beginPath()
    g.moveTo(r() * 320, r() * 256)
    g.quadraticCurveTo(r() * 320, r() * 256, r() * 320, r() * 256)
    g.stroke()
  }
  return tex(c)
})

// a calm landscape for the second frame
export const landscapeTex = once(() => {
  const [c, g] = canvas(320, 220)
  const sky = g.createLinearGradient(0, 0, 0, 140)
  sky.addColorStop(0, '#f6c28b')
  sky.addColorStop(1, '#f9e7c2')
  g.fillStyle = sky
  g.fillRect(0, 0, 320, 220)
  g.fillStyle = '#4f772d'
  g.beginPath()
  g.moveTo(0, 150)
  g.quadraticCurveTo(110, 110, 200, 145)
  g.quadraticCurveTo(260, 165, 320, 140)
  g.lineTo(320, 220)
  g.lineTo(0, 220)
  g.fill()
  g.fillStyle = '#2f5d8a'
  g.fillRect(0, 178, 320, 18)
  g.fillStyle = '#90a955'
  g.fillRect(0, 196, 320, 24)
  g.fillStyle = '#f28f3b'
  g.beginPath()
  g.arc(240, 70, 22, 0, Math.PI * 2)
  g.fill()
  return tex(c)
})

// the framed certificate in the red frame
export const certTex = once(() => {
  const [c, g] = canvas(200, 260)
  g.fillStyle = '#f7f3e8'
  g.fillRect(0, 0, 200, 260)
  g.strokeStyle = '#b08d57'
  g.lineWidth = 3
  g.strokeRect(12, 12, 176, 236)
  g.fillStyle = '#3b3b3b'
  g.font = 'bold 15px Georgia'
  g.textAlign = 'center'
  g.fillText('CERTIFICATE', 100, 52)
  g.fillStyle = '#8a8a8a'
  for (let y = 80; y < 200; y += 14) g.fillRect(36, y, 128 - ((y * 7) % 40), 3)
  g.fillStyle = '#b5332f'
  g.beginPath()
  g.arc(100, 222, 14, 0, Math.PI * 2)
  g.fill()
  return tex(c)
})

// TV screens: a cricket match, glowing
export const tvTex = (seed) => {
  const [c, g] = canvas(320, 180)
  const r = rng(seed)
  g.fillStyle = '#2e7d32'
  g.fillRect(0, 0, 320, 180)
  g.fillStyle = '#c8b27a'
  g.fillRect(140, 30, 40, 120)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillRect(140, 50, 40, 2)
  g.fillRect(140, 128, 40, 2)
  for (let i = 0; i < 9; i++) {
    g.fillStyle = r() < 0.5 ? '#f5f5f5' : '#1e88e5'
    g.beginPath()
    g.arc(20 + r() * 280, 20 + r() * 140, 4, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = 'rgba(10,10,30,0.85)'
  g.fillRect(0, 152, 320, 28)
  g.fillStyle = '#fff'
  g.font = 'bold 15px sans-serif'
  g.fillText(`BAN ${180 + Math.floor(r() * 90)}/${Math.floor(r() * 8)}  ·  ${30 + Math.floor(r() * 18)}.${Math.floor(r() * 6)} ov`, 10, 172)
  return tex(c)
}

// the restaurant's name over the kitchen door
export const signTex = once(() => {
  const [c, g] = canvas(512, 128)
  g.fillStyle = '#7a1420'
  g.fillRect(0, 0, 512, 128)
  g.strokeStyle = '#e0b356'
  g.lineWidth = 4
  g.strokeRect(8, 8, 496, 112)
  g.fillStyle = '#f3d27a'
  g.font = 'italic bold 62px Georgia'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('Darul Kebab', 256, 66)
  return tex(c)
})

// lettering on the front window, seen from inside (mirrored)
export const windowSignTex = once(() => {
  const [c, g] = canvas(512, 128)
  g.clearRect(0, 0, 512, 128)
  g.translate(512, 0)
  g.scale(-1, 1)
  g.fillStyle = 'rgba(200,30,45,0.92)'
  g.font = 'bold 54px Georgia'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('DARUL KEBAB', 256, 50)
  g.font = '28px Georgia'
  g.fillText('Biryani · Kebab · Curry', 256, 100)
  const t = tex(c)
  return t
})

// red brick for the building across the street
export const brickTex = once(() => {
  const [c, g] = canvas(256, 256)
  g.fillStyle = '#d9cfc2'
  g.fillRect(0, 0, 256, 256)
  const r = rng(9)
  const bw = 32
  const bh = 12
  for (let y = 0; y < 256; y += bh)
    for (let x = (y / bh) % 2 ? -bw / 2 : 0; x < 256; x += bw) {
      const v = Math.floor(r() * 30)
      g.fillStyle = `rgb(${150 + v},${62 + v / 2},${48 + v / 3})`
      g.fillRect(x + 1, y + 1, bw - 2, bh - 2)
    }
  return tex(c, [6, 3])
})

// drop ceiling: 60 cm white tiles in a grey grid
export const ceilingTex = once(() => {
  const [c, g] = canvas(256, 256)
  g.fillStyle = '#f3f2ec'
  g.fillRect(0, 0, 256, 256)
  const r = rng(13)
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = 'rgba(150,150,140,0.18)'
    g.fillRect(r() * 256, r() * 256, 1.5, 1.5)
  }
  g.fillStyle = '#c9c8c0'
  for (const p of [0, 128]) {
    g.fillRect(p, 0, 3, 256)
    g.fillRect(0, p, 256, 3)
  }
  return tex(c, [14 / 1.2, 12 / 1.2])
})

// the little white name cards in front of each chafing dish
export const labelTex = (name) => {
  const [c, g] = canvas(256, 72)
  g.fillStyle = '#fbfbf7'
  g.fillRect(0, 0, 256, 72)
  g.strokeStyle = '#333'
  g.lineWidth = 3
  g.strokeRect(3, 3, 250, 66)
  g.fillStyle = '#1a1a1a'
  g.font = 'bold 26px Arial'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const words = name.toUpperCase().split(' ')
  if (words.length > 2) {
    g.fillText(words.slice(0, -1).join(' '), 128, 24, 240)
    g.fillText(words.at(-1), 128, 52, 240)
  } else g.fillText(name.toUpperCase(), 128, 37, 240)
  return tex(c)
}

// the TV that's on: a colorful TV drama in a sunny room
export const tvShowTex = once(() => {
  const [c, g] = canvas(320, 180)
  g.fillStyle = '#e9dcc0'
  g.fillRect(0, 0, 320, 180)
  g.fillStyle = '#b8d6e8'
  g.fillRect(200, 10, 100, 80)
  g.fillStyle = '#f2f2f2'
  g.fillRect(40, 120, 240, 60)
  const people = [
    [70, '#d9455f'], [130, '#f3a712'], [190, '#2e8b57'], [250, '#6a4c93'],
  ]
  for (const [x, col] of people) {
    g.fillStyle = col
    g.beginPath()
    g.ellipse(x, 120, 24, 46, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#9a6a4a'
    g.beginPath()
    g.arc(x, 62, 14, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1b1210'
    g.beginPath()
    g.arc(x, 56, 14, Math.PI, 0)
    g.fill()
  }
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.font = 'bold 14px sans-serif'
  g.fillText('বাংলা TV', 12, 22)
  return tex(c)
})

// framed photos of dancers in bright costumes
export const danceTex = (seed) => {
  const [c, g] = canvas(320, 220)
  const r = rng(seed)
  const bg = g.createLinearGradient(0, 0, 320, 220)
  bg.addColorStop(0, seed % 2 ? '#3b2a4a' : '#e8c27a')
  bg.addColorStop(1, seed % 2 ? '#8a5a7a' : '#c76b3a')
  g.fillStyle = bg
  g.fillRect(0, 0, 320, 220)
  const cols = ['#e63946', '#ffb703', '#fb8500', '#f72585', '#ffd166', '#06d6a0']
  const n = seed % 2 ? 5 : 2
  for (let i = 0; i < n; i++) {
    const x = 40 + (i + 0.5) * (240 / n) + (r() - 0.5) * 20
    g.fillStyle = cols[Math.floor(r() * cols.length)]
    g.beginPath()
    g.moveTo(x, 90)
    g.lineTo(x - 34, 210)
    g.lineTo(x + 34, 210)
    g.fill()
    g.fillStyle = '#9a6a4a'
    g.beginPath()
    g.arc(x, 72, 14, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#9a6a4a'
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(x - 10, 100)
    g.lineTo(x - 40, 60 + r() * 40)
    g.moveTo(x + 10, 100)
    g.lineTo(x + 40, 60 + r() * 40)
    g.stroke()
  }
  return tex(c)
}

// a switched-off TV: black glass with a faint reflection
export const tvOffTex = once(() => {
  const [c, g] = canvas(128, 72)
  const gr = g.createLinearGradient(0, 0, 128, 72)
  gr.addColorStop(0, '#2a2a2e')
  gr.addColorStop(0.45, '#0d0d10')
  gr.addColorStop(1, '#18181c')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 72)
  return tex(c)
})
