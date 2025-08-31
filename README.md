# 3D Solar System Simulator

An interactive 3D solar system simulator built with Three.js, featuring real planetary positions, SpaceMouse support, and a beautiful space environment.

![Three.js](https://img.shields.io/badge/Three.js-0.179-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Vite](https://img.shields.io/badge/Vite-7.1-purple)
![License](https://img.shields.io/badge/License-ISC-green)

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
  - Asteroid belt with 2,000 individually simulated asteroids
- **Settings Panel**:
  - Toggle orbit visibility
  - Adjust planet scale
  - Toggle labels
  - Realistic scale mode
  - Toggle asteroid belt visibility

## Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- Chrome/Edge browser for full SpaceMouse support

### Installation

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd space

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open http://localhost:3000 in your browser (Chrome recommended for SpaceMouse support).

### Build for Production

```bash
# TypeScript check and production build
npm run build

# Preview production build
npm run preview
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

## Architecture

### Core Technologies
- **Three.js** (0.179.1) - 3D graphics rendering engine
- **TypeScript** (5.9.2) - Type safety and modern JavaScript features
- **Vite** (7.1.3) - Fast build tool with HMR support
- **WebHID API** - Hardware device integration for SpaceMouse

### Project Structure
```
src/
├── main.ts              # Application entry point
├── types/               # TypeScript type definitions
├── data/                # Planetary data and API integration
├── scene/               # 3D scene components
├── controls/            # Input handling (keyboard, mouse, SpaceMouse)
└── ui/                  # User interface components
```

## Performance

- **Rendering**: 60 FPS target with 15,000+ stars and 2,000 asteroids using instanced rendering
- **Memory**: Optimized geometry and texture usage
- **Controls**: Smooth 6DOF navigation with SpaceMouse or fallback controls
- **Physics**: Accurate orbital mechanics following Kepler's laws

## Future Enhancements

- [ ] High-resolution planet textures from NASA
- [ ] Real-time planetary positions from JPL Horizons API
- [x] Asteroid belt visualization with accurate orbital dynamics
- [ ] Comet trajectories and periodic comets
- [ ] Historical spacecraft mission paths
- [ ] VR/AR support
- [ ] Mobile touch controls
- [ ] Planetary atmosphere effects
- [ ] Dynamic lighting based on sun position

## Development Notes

- Planet sizes are scaled for visibility (can be toggled to realistic scale)
- Orbital distances are compressed for better viewing experience
- Time can be accelerated up to 100x normal speed
- SpaceMouse requires Chrome/Edge with WebHID support
- Asteroid belt follows Kepler's third law with realistic inclination distribution
- See `CLAUDE.md` for detailed development instructions

## Contributing

Contributions are welcome! Please ensure:
1. TypeScript compilation passes (`npm run build`)
2. Code follows existing patterns and conventions
3. Performance impact is minimal
4. Browser compatibility is maintained

## License

ISC License - See package.json for details