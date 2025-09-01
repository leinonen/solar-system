# 3D Solar System Simulator

Interactive 3D visualization of the solar system built with Three.js and TypeScript.

## Features

- **Realistic orbital mechanics** - Planets follow Keplerian motion with eccentricity and inclination
- **Power-law distance scaling** - Maintains realistic proportions while keeping outer planets navigable
- **6DOF SpaceMouse support** - Full navigation with 3DConnexion devices (Chrome/Edge)
- **Time control** - Speed up, slow down, or reverse time (up to 86 million x)
- **Interactive planets** - Click to focus, hover for information (mass, temperature, moons)
- **Complete moon systems** - All major moons with realistic orbits and collision-safe scaling
- **Visual enhancements**:
  - 15,000+ star field with Milky Way skybox
  - 2,000 individually simulated asteroids with realistic orbital distribution
  - Saturn's rings and major moons orbiting in equatorial plane
  - Planetary axes, poles, and equators showing true tilts
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

## Realistic Scaling System

This simulator uses a **power-law scaling formula** (`distance = 50 * AU^0.8`) that provides:

- **Realistic proportions** - Maintains accurate relative distances between planets
- **Navigable outer planets** - Neptune only 761 units from Sun (vs 4500+ with linear scaling)
- **Proper planetary separation** - Jupiter and Saturn maintain realistic spacing  
- **Collision-free moon orbits** - All 19 major moons orbit safely outside their parent planets
- **Smooth compression** - No artificial breakpoints or sudden scale jumps

### Distance Comparison
| Planet | Real Distance | Linear Scale | Power-Law Scale | Improvement |
|--------|---------------|--------------|-----------------|-------------|
| Earth | 1.0 AU | 50 units | 50 units | ✓ Reference |
| Jupiter | 5.2 AU | 260 units | 187 units | 28% more compact |
| Saturn | 9.6 AU | 480 units | 305 units | 36% more compact |
| Neptune | 30 AU | 1500 units | 761 units | 49% more compact |

**Result**: Entire solar system fits in manageable 761-unit radius while preserving scientific accuracy.

## Performance

- 60 FPS with instanced rendering for stars and asteroids
- Optimized LOD for labels and orbital paths
- Efficient orbital calculations using simplified Kepler's equations
- Power-law scaling reduces camera travel distances for better navigation

## Build

```bash
npm run build    # Production build
npm run preview  # Preview build
```

## License

ISC