# Claude Instructions for Space Project

## Project Overview
This is a 3D Solar System Simulator built with Three.js and TypeScript. The application provides an interactive visualization of the solar system with real planetary positions, SpaceMouse support, and various visual features.

## Technology Stack
- **Three.js** (0.179.1) - 3D graphics library
- **TypeScript** (5.9.2) - Type safety
- **Vite** (7.1.3) - Build tool and dev server
- **WebHID API** - For SpaceMouse device support

## Project Structure
```
space/
├── src/
│   ├── main.ts              - Application entry point
│   ├── types/
│   │   └── planet.ts         - Planet data types
│   ├── data/
│   │   ├── PlanetData.ts    - Solar system data
│   │   └── HorizonsAPI.ts   - NASA JPL API integration
│   ├── scene/
│   │   ├── SolarSystem.ts   - Main scene manager
│   │   ├── Planet.ts        - Planet rendering
│   │   ├── StarField.ts    - Background stars
│   │   └── Skybox.ts        - Milky Way background
│   ├── controls/
│   │   ├── SpaceMouseController.ts - 3DConnexion device support
│   │   └── FallbackControls.ts    - Keyboard/mouse controls
│   └── ui/
│       ├── Labels.ts        - Planet labels
│       ├── Settings.ts      - Settings panel
│       └── TimeControls.ts  - Time manipulation
├── index.html               - Main HTML file
├── vite.config.ts          - Vite configuration
└── package.json            - Node dependencies
```

## Available Scripts
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Development Guidelines
1. **Three.js Patterns**: Follow existing patterns for scene objects, materials, and geometries
2. **TypeScript**: Use strong typing, especially for planet data and API responses
3. **Performance**: Be mindful of render loop performance, use object pooling where appropriate
4. **Browser Compatibility**: WebHID API only works in Chromium browsers
5. **Scale**: Planet sizes are intentionally scaled for visibility, distances are compressed

## Key Features to Maintain
- Real-time orbital mechanics simulation
- SpaceMouse 6DOF navigation
- Interactive planet selection and information display
- Time control (speed up/slow down/reverse)
- Visual settings (orbits, labels, realistic scale)

## Testing Approach
No specific test framework is configured. Manual testing recommended:
1. Test all control schemes (keyboard, mouse, SpaceMouse)
2. Verify planet information accuracy
3. Check performance with time acceleration
4. Test browser compatibility

## Common Tasks
- **Adding new celestial bodies**: Update `PlanetData.ts` with orbital parameters
- **Modifying controls**: Edit `FallbackControls.ts` or `SpaceMouseController.ts`
- **UI changes**: Modify relevant files in `src/ui/`
- **Visual improvements**: Update shaders and materials in `src/scene/`

## Performance Considerations
- StarField uses instanced rendering for 15,000+ stars
- Planet labels use distance-based scaling to reduce overdraw
- Orbital paths are rendered as line segments
- Consider LOD (Level of Detail) for future texture improvements

## Future Enhancements Planned
- NASA texture integration for realistic planet surfaces
- Real-time ephemeris data from JPL Horizons API
- Asteroid belt and comet visualization
- Historical spacecraft mission paths
- VR/AR support

## Important Notes
- Development server runs on http://localhost:3000
- SpaceMouse requires user gesture to connect (security requirement)
- Time scale affects orbital calculations - extreme values may cause instability
- Planet scales can be toggled between visual and realistic modes