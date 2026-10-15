# Darul Kebab, Cambridge MA

**Walk it in your browser:** https://zlisto.github.io/darul_kebab/

A first-person walk-through of the dining room of Darul Kebab, a Cambridge restaurant that has since closed. It's built with React, Vite, three.js, and @react-three/fiber, in the same style as `https://github.com/zlisto/yale_som_virtual`.

The restaurant was on the east side of Mass Ave, so you walk in through the glass door on the west wall. Inside is one yellow dining room under a drop ceiling with a red trim band: twelve 4-top tables with a red cloth over the white one and teal napkins folded in the glasses, dark cherry slat-back chairs, and the buffet along the east wall, a gold-skirted counter with ten round chafing dishes and their name cards. Above the buffet are three TVs (one on) and framed photos of dancers; on the north wall are a violin, a red-framed print and a banjo. The owner waits by the door holding a plate of biryani. Walk up to him and he says hello.

This is the second world on the **Metaverse Web**: each world is its own live website, linked to others by portals you walk through. Walk out the front door and you arrive in [Metaverse Square](https://zlisto.github.io/hub_world/), the plaza with a portal to every world, including this one and [Yale SOM's Evans Hall](https://zlisto.github.io/yale_som_virtual/), whose west-cloister portal also leads here. Visit both in the [Metaverse Browser](https://zlisto.github.io/metaverse_browser/). Music is a Bengali folk tune synthesized in code (N mutes).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5174 (Yale runs on 5173; the metaverse browser will run on 5175).

Controls match the Yale world: W A S D to walk, the mouse to look, Shift to hurry, Space to jump, C to crouch, M for the map, and Esc to pause. On a phone, use the on-screen joystick.

## How it's built

- `src/layout.js`: the room in meters (+x east, -z north; front door and windows on the west wall facing Mass Ave), tables, chairs, the buffet and its dishes, the owner's spot, collision, and room labels.
- `src/World.jsx`: walls, drop ceiling, the storefront and Mass Ave outside, tables, chairs, the buffet, wall decor and lights.
- `src/Owner.jsx`: the owner, built from primitives, holding the biryani plate and turning to face you.
- `src/textures.js`: procedural canvas textures (terracotta tile, yellow plaster, cherry wood, striped shirt, dotted tie, rice, paintings, TVs, signs).
- `src/Player.jsx`, `src/TouchControls.jsx`, `src/Minimap.jsx`: controls and the map, adapted from the Yale world.

The room is estimated from two photos, so sizes are approximate. The owner is a stylized cartoon, not a likeness.
