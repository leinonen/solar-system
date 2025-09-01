# 3D Solar System Simulator

Interactive 3D visualization of the solar system built with Three.js and TypeScript.

## Features

- **Simplified orbital mechanics** - Planets follow basic Keplerian motion with eccentricity and inclination
- **6DOF SpaceMouse support** - Full navigation with 3DConnexion devices (Chrome/Edge)
- **Time control** - Speed up, slow down, or reverse time (up to 86 million x)
- **Interactive planets** - Click to focus, hover for information (mass, temperature, moons)
- **Visual enhancements**:
  - 15,000+ star field with Milky Way skybox
  - 2,000 individually simulated asteroids with realistic orbital distribution
  - Saturn's rings and major moons
  - Planetary axes, poles, and equators
  - Distance-based label scaling
- **Customizable display** - Toggle orbits, labels, realistic scale, asteroid belt

## Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Controls

**Keyboard & Mouse**
- `W/A/S/D` - Move forward/left/backward/right
- `Q/E` - Move up/down
- `Shift` - Speed boost
- Mouse drag - Rotate view
- Scroll - Zoom
- Click planet - Focus camera

**SpaceMouse** (Chrome/Edge only)
- 6DOF navigation with 3DConnexion devices
- Button 1 - Reset view

## Tech Stack

- **Three.js** 0.179 - 3D graphics
- **TypeScript** 5.9 - Type safety
- **Vite** 7.1 - Build tooling
- **WebHID API** - SpaceMouse support

## Performance

- 60 FPS with instanced rendering for stars and asteroids
- Optimized LOD for labels and orbital paths
- Efficient orbital calculations using simplified Kepler's equations

## Build

```bash
npm run build    # Production build
npm run preview  # Preview build
```

## License

ISC