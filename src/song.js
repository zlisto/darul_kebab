import { drum, flute, playSong, pluck } from './audio.js'

// "Mass Ave Baul": a Bengali folk tune in the spirit of baul and bhatiali songs, generated in code.
// Tanpura drone on Sa and Pa, a dotara (plucked lute) singing the melody in raga Khamaj
// (flat seventh), a bansuri flute answering it, and a dholak playing keherwa (8 beats):
// dha ge na ti | na ka dhi na.

const SA = 50 // D3: Sa for the tanpura; the melody sits an octave up
const MATRA = 0.34 // one beat of keherwa
const CYCLE = 8
const KEHERWA = ['dha', 'ge', 'na', 'ti', 'na', 'ka', 'dhi', 'na']
const ACCENT = [1, 0.6, 0.7, 0.45, 0.7, 0.45, 0.85, 0.6]

// Khamaj: Sa Re Ga Ma Pa Dha ni Sa' (scale degrees → semitones)
const SCALE = [0, 2, 4, 5, 7, 9, 10, 12, 14, 16]
const note = (deg) => SA + 12 + SCALE[Math.max(0, Math.min(SCALE.length - 1, deg))]

let seed = 1971
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)

// rhythm templates for a 2-cycle (16 matra) phrase, in matras; each ends on a long note
const RHYTHMS = [
  [1, 1, 2, 1, 1, 2, 2, 2, 4],
  [2, 1, 1, 2, 2, 1, 1, 1, 1, 4],
  [1, 1, 1, 1, 2, 2, 1, 1, 2, 4],
  [3, 1, 2, 2, 1, 1, 2, 4],
]

// make a phrase: a stepwise walk that rises toward Pa or Sa' and settles on Sa or Pa
function phrase(end) {
  const r = RHYTHMS[Math.floor(rnd() * RHYTHMS.length)]
  let deg = [0, 2, 4][Math.floor(rnd() * 3)]
  const notes = r.map((len, k) => {
    if (k === r.length - 1) deg = end
    else if (k === r.length - 2) deg = end + (rnd() < 0.5 ? 1 : 2)
    else deg = Math.max(0, Math.min(8, deg + [-1, -1, 0, 1, 1, 2, -2][Math.floor(rnd() * 7)]))
    return { len, deg, slide: rnd() < 0.18 ? 2 : 0 }
  })
  // lay it out on matras
  let at = 0
  return notes.map((n) => {
    const placed = { ...n, at }
    at += n.len
    return placed
  })
}

// song form: A A B A, then the flute takes B and A'
const A = phrase(0)
const B = phrase(4)
const A2 = phrase(0)
const FORM = [
  { p: A, flute: false },
  { p: A, flute: false },
  { p: B, flute: false },
  { p: A, flute: false },
  { p: B, flute: true },
  { p: A2, flute: true },
  { p: B, flute: false },
  { p: A2, flute: false },
]
const PHRASE = 16 // matras

export function startSong() {
  playSong(MATRA, (i, t) => {
    const m = i % CYCLE
    const section = Math.floor(i / PHRASE) % FORM.length
    const intro = i < PHRASE // first phrase: just drone and drums

    // tanpura: Pa Sa' Sa' Sa, one pluck every two matras, ringing long
    if (i % 2 === 0) {
      const tan = [SA - 5, SA + 12, SA + 12, SA][(i / 2) % 4]
      pluck(t, tan, { gain: 0.11, seconds: 4, loss: 0.9992, bright: 0.85, pan: -0.35, send: 0.5 })
    }

    // dholak, keherwa, with a little humanized timing
    if (i >= CYCLE / 2) drum(t + (rnd() - 0.5) * 0.012, KEHERWA[m], 0.32 * ACCENT[m])

    if (intro) return
    const { p, flute: fl } = FORM[section]
    const at = i % PHRASE
    const n = p.find((x) => x.at === at)
    if (!n) return
    // dotara plays the tune, doubling long notes with a quick re-pluck like a real player
    pluck(t, note(n.deg), { gain: 0.26, seconds: 2.5, loss: 0.997, bright: 0.75, pan: 0.2, slide: n.slide })
    if (n.len >= 2) pluck(t + MATRA, note(n.deg), { gain: 0.14, seconds: 2, loss: 0.996, bright: 0.6, pan: 0.2 })
    if (fl) flute(t, note(n.deg) + 12, n.len * MATRA * 0.95, 0.045, n.slide)
  })
}
