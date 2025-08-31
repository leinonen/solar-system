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
      },
      {
        name: 'Deimos',
        radius: 6.2,
        orbitalRadius: 23463 / AU,
        orbitalPeriod: 1.263,
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
      },
      {
        name: 'Europa',
        radius: 1560.8,
        orbitalRadius: 671034 / AU,
        orbitalPeriod: 3.551,
      },
      {
        name: 'Ganymede',
        radius: 2634.1,
        orbitalRadius: 1070412 / AU,
        orbitalPeriod: 7.155,
      },
      {
        name: 'Callisto',
        radius: 2410.3,
        orbitalRadius: 1882709 / AU,
        orbitalPeriod: 16.689,
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
      },
      {
        name: 'Enceladus',
        radius: 252.1,
        orbitalRadius: 238000 / AU,
        orbitalPeriod: 1.370,
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
  return auDistance * 30; // 30 units per AU for good spacing
}

export function getScaledMoonRadius(radius: number): number {
  // Scale moons proportionally to planets for realistic size ratios
  // Use same scaling as planets: Earth radius = 1 unit
  const earthRadius = 6371;
  return Math.max(0.05, (radius / earthRadius) * 1);
}

export function getScaledMoonOrbitRadius(radiusAU: number, planetName: string): number {
  // Compromise between realism and visibility
  // Ensure moons orbit outside their parent planet while avoiding planetary collisions
  const realisticRadius = radiusAU * 30; // Same scale as planetary orbits
  
  if (planetName === 'Earth') {
    // Earth's moon: ensure it orbits outside Earth's radius with some margin
    // Earth radius = 1 unit, so minimum orbit = 1.5 units
    return Math.max(1.5, realisticRadius);
  } else if (planetName === 'Mars') {
    // Mars radius ≈ 0.53 units, scale moons proportionally but ensure they're outside the planet
    // Phobos and Deimos are very close to Mars, so we need to scale them up for visibility
    const scaledRadius = realisticRadius * 1000; // Scale up by 1000 for visibility
    return Math.max(0.8, scaledRadius);
  } else if (planetName === 'Jupiter') {
    // Jupiter radius ≈ 11 units, scale moons proportionally but ensure they're outside the planet
    // Jupiter's moons are relatively close, so we need to scale them up for visibility and separation
    const scaledRadius = realisticRadius * 150; // Scale up by 150 for visibility
    return Math.max(12, scaledRadius);
  } else if (planetName === 'Saturn') {
    // Saturn radius ≈ 9.1 units, scale moons proportionally but ensure they're outside the planet
    // Saturn's moons need scaling up for visibility and separation
    const scaledRadius = realisticRadius * 200; // Scale up by 200 for visibility
    return Math.max(10, scaledRadius);
  } else {
    // For other planets, use minimum safe distance
    return Math.max(1.0, realisticRadius);
  }
}