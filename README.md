# 3D Solar System Simulator

An interactive 3D solar system simulator built with Three.js, featuring real planetary positions, SpaceMouse support, and a beautiful space environment.

## Features

- **Realistic Solar System**: All planets with accurate relative sizes and orbital mechanics
- **SpaceMouse Support**: Full 6DOF navigation using 3DConnexion SpaceMouse devices via WebHID API
- **Interactive Controls**: 
  - Mouse drag to rotate view
  - Scroll to zoom
  - WASD+QE keys for movement
  - Click on planets to focus
- **Time Controls**: Speed up, slow down, or reverse time
- **Planet Information**: Hover over planets to see details (mass, size, temperature, etc.)
- **Visual Features**:
  - 15,000+ star field
  - Milky Way skybox
  - Planet labels with distance-based scaling
  - Orbital path visualization
  - Saturn's rings and major moons
- **Settings Panel**:
  - Toggle orbit visibility
  - Adjust planet scale
  - Toggle labels
  - Realistic scale mode

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser (Chrome recommended for SpaceMouse support).

## Build

```bash
npm run build
```

## Controls

### Keyboard
- **W/S**: Move forward/backward
- **A/D**: Move left/right
- **Q/E**: Move up/down
- **Shift**: Speed boost
- **Mouse drag**: Rotate view
- **Scroll**: Zoom in/out

### SpaceMouse (Chrome only)
1. Click "Connect SpaceMouse" button
2. Select your 3DConnexion device
3. Use 6DOF controls for navigation
4. Button 1: Reset view

## Browser Support

- **Full support**: Chrome, Edge (Chromium-based)
- **Limited support** (no SpaceMouse): Firefox, Safari

## Technologies

- Three.js - 3D graphics engine
- TypeScript - Type safety
- Vite - Build tool
- WebHID API - SpaceMouse integration
- NASA JPL Horizons API - Planetary ephemeris data (planned)

## Future Enhancements

- High-resolution planet textures from NASA
- Real-time planetary positions from JPL Horizons API
- Asteroid belt visualization
- Comet trajectories
- Spacecraft missions
- VR support

## Notes

- Planet sizes are scaled for visibility (can be toggled to realistic scale)
- Orbital distances are compressed for better viewing
- Time can be accelerated up to 100x normal speed
- SpaceMouse requires Chrome/Edge with WebHID support