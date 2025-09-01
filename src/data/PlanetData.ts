import { Color } from 'three';
import { PlanetData } from '../types/planet';

export const AU = 149597870.7; // km
export const EARTH_RADIUS = 6371; // km

export const SUN_DATA = {
  name: 'Sun',
  radius: 696340, // km
  mass: 1.989e30, // kg
  rotationPeriod: 24.47, // days (sidereal rotation at equator)
  temperature: {
    surface: 5778, // K
    core: 15000000 // K
  },
  color: new Color(0xffff00),
};

export const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    radius: 2439.7,
    mass: 3.3011e23,
    orbitalRadius: 0.387,
    orbitalPeriod: 87.969,
    rotationPeriod: 1407.6,
    inclination: 7.005,
    eccentricity: 0.2056,
    axialTilt: 0.034,
    color: new Color(0x8c7853),
    temperature: { min: -173, max: 427 },
  },
  {
    name: 'Venus',
    radius: 6051.8,
    mass: 4.8675e24,
    orbitalRadius: 0.723,
    orbitalPeriod: 224.701,
    rotationPeriod: -5832.5, // Negative for retrograde rotation
    inclination: 3.3946,
    eccentricity: 0.0067,
    axialTilt: 177.4,
    color: new Color(0xffc649),
    temperature: { min: 462, max: 462 },
  },
  {
    name: 'Earth',
    radius: 6371,
    mass: 5.972e24,
    orbitalRadius: 1.0,
    orbitalPeriod: 365.256,
    rotationPeriod: 23.9345,
    inclination: 0.0,
    eccentricity: 0.0167,
    axialTilt: 23.44,
    color: new Color(0x2233ff),
    temperature: { min: -88, max: 58 },
    moons: [
      {
        name: 'Moon',
        radius: 1737.4,
        orbitalRadius: 384400 / AU, // Convert km to AU
        orbitalPeriod: 27.322,
        inclination: 5.145, // degrees to Earth's equator
      },
    ],
  },
  {
    name: 'Mars',
    radius: 3389.5,
    mass: 6.4171e23,
    orbitalRadius: 1.524,
    orbitalPeriod: 686.98,
    rotationPeriod: 24.6229,
    inclination: 1.85,
    eccentricity: 0.0935,
    axialTilt: 25.19,
    color: new Color(0xff3333),
    temperature: { min: -143, max: 35 },
    moons: [
      {
        name: 'Phobos',
        radius: 11.267,
        orbitalRadius: 9376 / AU,
        orbitalPeriod: 0.31891,
        inclination: 1.093, // degrees to Mars equator
      },
      {
        name: 'Deimos',
        radius: 6.2,
        orbitalRadius: 23463 / AU,
        orbitalPeriod: 1.263,
        inclination: 1.791, // degrees to Mars equator
      },
    ],
  },
  {
    name: 'Jupiter',
    radius: 69911,
    mass: 1.8982e27,
    orbitalRadius: 5.204,
    orbitalPeriod: 4332.59,
    rotationPeriod: 9.9250,
    inclination: 1.303,
    eccentricity: 0.0489,
    axialTilt: 3.13,
    color: new Color(0xcc9966),
    temperature: { min: -145, max: -145 },
    moons: [
      {
        name: 'Io',
        radius: 1821.6,
        orbitalRadius: 421800 / AU,
        orbitalPeriod: 1.769,
        inclination: 0.05, // degrees to Jupiter's equator
      },
      {
        name: 'Europa',
        radius: 1560.8,
        orbitalRadius: 671034 / AU,
        orbitalPeriod: 3.551,
        inclination: 0.47, // degrees to Jupiter's equator
      },
      {
        name: 'Ganymede',
        radius: 2634.1,
        orbitalRadius: 1070412 / AU,
        orbitalPeriod: 7.155,
        inclination: 0.20, // degrees to Jupiter's equator
      },
      {
        name: 'Callisto',
        radius: 2410.3,
        orbitalRadius: 1882709 / AU,
        orbitalPeriod: 16.689,
        inclination: 0.51, // degrees to Jupiter's equator
      },
    ],
  },
  {
    name: 'Saturn',
    radius: 58232,
    mass: 5.6834e26,
    orbitalRadius: 9.5826,
    orbitalPeriod: 10759.22,
    rotationPeriod: 10.656,
    inclination: 2.485,
    eccentricity: 0.0565,
    axialTilt: 26.73,
    color: new Color(0xffcc99),
    temperature: { min: -178, max: -178 },
    rings: [
      {
        innerRadius: 74500 / EARTH_RADIUS,
        outerRadius: 140000 / EARTH_RADIUS,
      },
    ],
    moons: [
      {
        name: 'Titan',
        radius: 2574.7,
        orbitalRadius: 1221700 / AU,
        orbitalPeriod: 15.945,
        inclination: 0.34, // degrees to Saturn's equator
      },
      {
        name: 'Enceladus',
        radius: 252.1,
        orbitalRadius: 238000 / AU,
        orbitalPeriod: 1.370,
        inclination: 0.02, // degrees to Saturn's equator
      },
    ],
  },
  {
    name: 'Uranus',
    radius: 25362,
    mass: 8.6810e25,
    orbitalRadius: 19.2184,
    orbitalPeriod: 30688.5,
    rotationPeriod: -17.24, // Negative for retrograde
    inclination: 0.773,
    eccentricity: 0.0463,
    axialTilt: 97.77,
    color: new Color(0x4FD0E0),
    temperature: { min: -224, max: -224 },
    rings: [
      {
        innerRadius: 41837 / EARTH_RADIUS,
        outerRadius: 51149 / EARTH_RADIUS,
      },
    ],
    moons: [
      {
        name: 'Miranda',
        radius: 236,
        orbitalRadius: 129900 / AU,
        orbitalPeriod: 1.413,
        inclination: 4.34, // degrees to Uranus equator
      },
      {
        name: 'Ariel',
        radius: 579,
        orbitalRadius: 190900 / AU,
        orbitalPeriod: 2.520,
        inclination: 0.04, // degrees to Uranus equator
      },
      {
        name: 'Umbriel',
        radius: 585,
        orbitalRadius: 266000 / AU,
        orbitalPeriod: 4.144,
        inclination: 0.13, // degrees to Uranus equator
      },
      {
        name: 'Titania',
        radius: 789,
        orbitalRadius: 436300 / AU,
        orbitalPeriod: 8.706,
        inclination: 0.08, // degrees to Uranus equator
      },
      {
        name: 'Oberon',
        radius: 761,
        orbitalRadius: 583500 / AU,
        orbitalPeriod: 13.463,
        inclination: 0.07, // degrees to Uranus equator
      },
    ],
  },
  {
    name: 'Neptune',
    radius: 24622,
    mass: 1.02413e26,
    orbitalRadius: 30.07,
    orbitalPeriod: 60195,
    rotationPeriod: 16.11,
    inclination: 1.768,
    eccentricity: 0.0095,
    axialTilt: 28.32,
    color: new Color(0x3366ff),
    temperature: { min: -218, max: -218 },
    moons: [
      {
        name: 'Triton',
        radius: 1353.4,
        orbitalRadius: 354800 / AU,
        orbitalPeriod: -5.877, // Negative for retrograde
        inclination: 156.885, // degrees to Neptune's equator (highly inclined retrograde orbit)
      },
    ],
  },
];

// Simple fixed scales for visualization
export function getScaledRadius(radius: number, isSun: boolean = false): number {
  if (isSun) {
    return 5; // Fixed sun size
  }
  // Scale planets: Earth = 1 unit, others proportional but minimum 0.2
  const earthRadius = 6371;
  return Math.max(0.2, (radius / earthRadius) * 1);
}

export function getScaledOrbitRadius(auDistance: number): number {
  // Power-law scaling for realistic solar system proportions
  // Provides smooth compression that maintains relative distances while keeping
  // the outer planets at manageable distances for navigation
  
  const baseScale = 50; // Units - maintains Earth at ~50 units
  const exponent = 0.8; // Compression factor: 0.6 = more compressed, 0.8 = less compressed, 1.0 = linear
  
  // Power-law formula: distance = baseScale * (auDistance^exponent)
  // This creates smooth compression without artificial breakpoints
  return baseScale * Math.pow(auDistance, exponent);
}

export function getScaledMoonRadius(radius: number): number {
  // Scale moons proportionally to planets for realistic size ratios
  // Use same scaling as planets: Earth radius = 1 unit
  const earthRadius = 6371;
  return Math.max(0.05, (radius / earthRadius) * 1);
}

export function getScaledMoonOrbitRadius(radiusAU: number, planetName: string): number {
  // Realistic proportional scaling with compressed distances for visualization
  // Maintains realistic orbital ratios while keeping distances manageable for the scene
  
  const planet = PLANETS.find(p => p.name === planetName);
  if (!planet) {
    return Math.max(1.0, radiusAU * 50);
  }
  
  // Get planet's scaled radius for collision calculations
  const planetRadius = getScaledRadius(planet.radius);
  
  // Calculate realistic orbital distance in planet radii
  const orbitRadiusKm = radiusAU * AU; // Convert AU to km
  const orbitInPlanetRadii = orbitRadiusKm / planet.radius;
  
  // Use a compressed scaling system similar to planetary orbits
  // This maintains proportions while keeping distances reasonable
  let baseScale: number;
  
  // Determine base scale based on planet's position in solar system
  const planetAU = planet.orbitalRadius;
  if (planetAU <= 1.5) { // Inner planets: Earth, Mars
    baseScale = 50;
  } else if (planetAU <= 6.0) { // Jupiter region
    baseScale = 80;
  } else if (planetAU <= 10.0) { // Saturn region  
    baseScale = 100;
  } else if (planetAU <= 20.0) { // Uranus region
    baseScale = 120;
  } else { // Neptune and beyond
    baseScale = 150;
  }
  
  // Calculate compressed orbital radius
  const compressedOrbitRadius = radiusAU * baseScale;
  
  // Apply planet-specific visibility adjustments while maintaining proportions
  let visibilityMultiplier: number;
  
  if (planetName === 'Earth') {
    // Earth's moon: keep existing good scaling
    visibilityMultiplier = 1.0;
    const minOrbit = planetRadius + 0.5; // Safety margin
    return Math.max(minOrbit, compressedOrbitRadius);
    
  } else if (planetName === 'Mars') {
    // Mars moons are extremely close - need significant scaling for visibility
    // But maintain proportional relationships between Phobos and Deimos
    visibilityMultiplier = orbitInPlanetRadii < 5 ? 400 : 300; // Scale up small orbits more
    
  } else if (planetName === 'Jupiter') {
    // Jupiter moons: progressive scaling based on distance
    if (orbitInPlanetRadii < 10) {
      visibilityMultiplier = 30; // Inner moons need more scaling
    } else if (orbitInPlanetRadii < 20) {
      visibilityMultiplier = 25;
    } else {
      visibilityMultiplier = 20; // Outer moons need less scaling
    }
    
  } else if (planetName === 'Saturn') {
    // Saturn moons: moderate scaling
    if (orbitInPlanetRadii < 10) {
      visibilityMultiplier = 20;
    } else {
      visibilityMultiplier = 8;
    }
    
  } else if (planetName === 'Uranus') {
    // Uranus moons: high scaling needed to prevent collisions due to close orbits
    visibilityMultiplier = orbitInPlanetRadii < 10 ? 60 : 35;
    
  } else if (planetName === 'Neptune') {
    // Neptune Triton: moderate scaling
    visibilityMultiplier = 12;
    
  } else {
    // Default case
    visibilityMultiplier = 1.0;
  }
  
  // Apply visibility scaling to compressed orbit
  const scaledOrbitRadius = compressedOrbitRadius * visibilityMultiplier;
  
  // Calculate minimum safe orbit to prevent collision
  let maxMoonRadius = 0;
  if (planet.moons) {
    planet.moons.forEach(moon => {
      const moonRadius = getScaledMoonRadius(moon.radius);
      maxMoonRadius = Math.max(maxMoonRadius, moonRadius);
    });
  }
  
  const safetyMargin = 0.2; // Reduced visual separation margin for better proportions
  const minSafeOrbit = planetRadius + maxMoonRadius + safetyMargin;
  
  return Math.max(minSafeOrbit, scaledOrbitRadius);
}