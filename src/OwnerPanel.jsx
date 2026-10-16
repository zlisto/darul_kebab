import { DOORS, PORTAL } from './layout.js'
import { navigate } from './mvw.js'
import { fadeOut, whoosh } from './audio.js'

// Monir's farewell: same greeting bubble, plus Go → buttons like Labubuldore.

const DESTINATIONS = [
  { label: 'Metaverse Square', sub: 'every world · portal', href: PORTAL.href, spawn: PORTAL.spawn, back: PORTAL.back },
  ...DOORS.map((d) => ({ label: d.label, sub: d.sub, href: d.href, spawn: d.spawn, back: d.back })),
]

export default function OwnerPanel({ visitor, onClose }) {
  const go = (d) => {
    fadeOut()
    whoosh()
    navigate(d.href, d.spawn, d.back)
  }

  return (
    <div className="guide" role="dialog" aria-label="Talking with Monir Saji">
      <header>
        <div className="guide-avatar">MS</div>
        <div className="guide-title">
          Monir Saji
          <span>owner · Darul Kebab</span>
        </div>
        <button className="guide-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="guide-log">
        <div className="guide-msg tauhid">
          <p>
            Hey{visitor ? ` ${visitor}` : ''}, I'm Monir, welcome to Darul Kebab. Please sit anywhere and enjoy our
            authentic Bangladeshi food. When you're ready, I can send you through a doorway myself.
          </p>
        </div>
        <div className="world-list">
          {DESTINATIONS.map((d) => (
            <div key={d.label} className="world-card ok">
              <div className="world-head">
                <span className="world-dot" />
                <b>{d.label}</b>
                <button onClick={() => go(d)}>Go →</button>
              </div>
              <span className="world-host">{d.sub}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="guide-foot">Walk away, Esc or × to keep exploring</div>
    </div>
  )
}
